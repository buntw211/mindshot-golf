import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { insertSessionSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import express from "express";
import OpenAI from "openai";
import * as bcrypt from "bcryptjs";

const uploadDir = path.join(process.cwd(), "uploads");

const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

type AuthedRequest = Request & {
  authUserId?: string;
};

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const userId = req.cookies?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.authUserId = String(userId);
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  app.use("/uploads", express.static(uploadDir));
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body ?? {};

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const normalizedEmail = String(email).trim().toLowerCase();

      const existingUser = await storage.getUserByEmail?.(normalizedEmail);
      if (existingUser) {
        return res.status(400).json({ message: "An account with that email already exists" });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await storage.createUser?.({
        email: normalizedEmail,
        passwordHash,
      });

      res.cookie("userId", String(user.id), {
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        path: "/",
      });

      return res.status(201).json({
        message: "Account created successfully",
        user: {
          id: user.id,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("Signup error:", error);
      return res.status(500).json({ message: "Unable to create account" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body ?? {};

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const normalizedEmail = String(email).trim().toLowerCase();

      const user = await storage.getUserByEmail?.(normalizedEmail);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      res.cookie("userId", String(user.id), {
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        path: "/",
      });

      return res.json({
        user: {
          id: user.id,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Unable to sign in" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req: AuthedRequest, res: Response) => {
    try {
      const userId = req.authUserId!;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.json({
        id: user.id,
        email: user.email,
      });
    } catch (error) {
      console.error("Auth me error:", error);
      return res.status(500).json({ message: "Failed to fetch current user" });
    }
  });
  app.post(
    "/api/upload/scorecard",
    requireAuth,
    upload.single("scorecard"),
    (req: any, res: Response) => {
      if (!req.file) {
        return res
          .status(400)
          .json({ error: "No image file provided or invalid file type" });
      }

      const imageUrl = `/uploads/${req.file.filename}`;
      return res.json({ url: imageUrl });
    },
  );

  app.get("/api/sessions", requireAuth, async (req: AuthedRequest, res: Response) => {
    try {
      const userId = req.authUserId!;
      const sessions = await storage.getSessions(userId);
      return res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      return res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.get("/api/sessions/:id", requireAuth, async (req: AuthedRequest, res: Response) => {
    try {
      const session = await storage.getSession(req.params.id);

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const userId = req.authUserId!;
      if (String(session.userId) !== String(userId)) {
        return res.status(403).json({ error: "Not authorized" });
      }

      return res.json(session);
    } catch (error) {
      console.error("Error fetching session:", error);
      return res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  app.post("/api/sessions", requireAuth, async (req: AuthedRequest, res: Response) => {
    try {
      const userId = req.authUserId!;
      const validatedData = insertSessionSchema.parse(req.body);
      const session = await storage.createSession(validatedData, userId);

      return res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid session data", details: error.errors });
      }

      console.error("Error creating session:", error);
      return res.status(500).json({ error: "Failed to create session" });
    }
  });

  app.patch("/api/sessions/:id", requireAuth, async (req: AuthedRequest, res: Response) => {
    try {
      const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const session = await storage.getSession(sessionId);

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const userId = req.authUserId!;
      if (String(session.userId) !== String(userId)) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const updated = await storage.updateSession(sessionId, req.body);
      return res.json(updated);
    } catch (error) {
      console.error("Error updating session:", error);
      return res.status(500).json({ error: "Failed to update session" });
    }
  });

  app.delete("/api/sessions/:id", requireAuth, async (req: AuthedRequest, res: Response) => {
    try {
      const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const session = await storage.getSession(sessionId);

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const userId = req.authUserId!;
      if (String(session.userId) !== String(userId)) {
        return res.status(403).json({ error: "Not authorized" });
      }

      await storage.deleteSession(sessionId);
      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting session:", error);
      return res.status(500).json({ error: "Failed to delete session" });
    }
  });

  app.post(
    "/api/sessions/:id/insights",
    requireAuth,
    async (req: AuthedRequest, res: Response) => {
      try {
        const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const session = await storage.getSession(sessionId);

        if (!session) {
          return res.status(404).json({ error: "Session not found" });
        }

        const userId = req.authUserId!;
        if (String(session.userId) !== String(userId)) {
          return res.status(403).json({ error: "Not authorized" });
        }

        const isPlay = session.type === "play";
        const ratings = session.selfRatings as Record<string, number> | null;

        let journalContent = "";

        if (isPlay) {
          const fields = [
            ["Course", session.courseName],
            ["Score", session.score],
            ["Pre-Round Mental State", session.preRoundMentalState],
            ["Pre-Round Goals", session.preRoundGoals],
            ["Pre-Round Routine", session.preRoundRoutine],
            ["Focus Quality", session.focusQuality],
            ["Thought Process", session.thoughtProcess],
            ["Miss Pattern", session.missPattern],
            ["What Gained Strokes", session.strokeGains],
            ["What Cost Strokes", session.gameCosts],
            ["Course Management", session.courseManagement],
            ["Target Selection", session.targetSelection],
            ["Emotional Decisions", session.emotionalDecisions],
            ["Adversity Response", session.adversityResponse],
            ["Routine Commitment", session.routineCommitment],
            ["Joy Moments", session.joyMoments],
            ["Emotional Challenges", session.emotionalChallenges],
            ["Key Moments", session.keyMoments],
            ["Decisions Reflection", session.decisionsReflection],
            ["Emotional Highs", session.emotionalHighs],
            ["Emotional Lows", session.emotionalLows],
            ["Lessons Learned", session.lessonsLearned],
            ["Gratitude", session.gratitude],
            ["Next Session Goals", session.nextSessionGoals],
          ];

          journalContent = fields
            .filter(([, v]) => v && String(v).trim())
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n");

          if (session.freeWriting?.trim()) {
            journalContent += `\nFree Writing: ${session.freeWriting}`;
          }
        } else {
          const fields = [
            ["Practice Type", session.practiceType],
            ["Duration", session.duration ? `${session.duration} minutes` : null],
            ["Focus Quality", session.focusQuality],
            ["Thought Process", session.thoughtProcess],
            ["Swing Focus", session.swingFocus],
            ["Lessons Learned", session.lessonsLearned],
            ["Next Session Goals", session.nextSessionGoals],
          ];

          journalContent = fields
            .filter(([, v]) => v && String(v).trim())
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n");
        }

        let ratingsText = "";
        if (ratings) {
          ratingsText = Object.entries(ratings)
            .map(([k, v]) => `${k}: ${v}/10`)
            .join(", ");
        }

        const openai = new OpenAI({
          apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
          baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
        });

        const systemPrompt = `You are a sports psychologist specializing in golf mental performance. You analyze golfers' journal entries and self-assessment ratings to provide personalized, actionable feedback.

Your response should be structured with these sections, using markdown formatting:
## Key Strengths
Identify 2-3 mental strengths from this session based on their journal and ratings.

## Areas for Growth
Identify 1-2 specific areas that need attention, with empathetic framing.

## Actionable Tips
Provide 2-3 concrete, practical mental game exercises or strategies they can use in their next session.

## Pattern Insight
One observation about a mental pattern you notice that the golfer might not be aware of.

Keep the tone warm, encouraging, and coach-like. Be specific to their actual journal content — don't be generic. Total response should be 200-300 words.`;

        const userPrompt = `Analyze this golf ${isPlay ? "round" : "practice session"} journal entry:

Date: ${session.date}
Overall Mood: ${session.overallMood}/10
Overall Focus: ${session.overallFocus}/10
${ratingsText ? `Self-Assessment Ratings: ${ratingsText}` : ""}
${journalContent ? `\nJournal Notes:\n${journalContent}` : "(No detailed notes provided)"}`;

        const response = await openai.chat.completions.create({
          model: "gpt-5.2",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_completion_tokens: 800,
        });

        const choice = response.choices[0]?.message;
        console.log(
          "AI insights response:",
          JSON.stringify({
            content: choice?.content?.substring(0, 100),
            refusal: choice?.refusal,
            finishReason: response.choices[0]?.finish_reason,
          }),
        );

        const insights =
          choice?.content || choice?.refusal || "Unable to generate insights at this time.";

        await storage.updateSession(sessionId, { aiInsights: insights });

        return res.json({ insights });
      } catch (error) {
        console.error("Error generating AI insights:", error);
        return res.status(500).json({ error: "Failed to generate insights" });
      }
    },
  );

  app.get("/api/dashboard", requireAuth, async (req: AuthedRequest, res: Response) => {
    try {
      const userId = req.authUserId!;
      const stats = await storage.getDashboardStats(userId);
      return res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      return res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/patterns", requireAuth, async (req: AuthedRequest, res: Response) => {
    try {
      const userId = req.authUserId!;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const patterns = await storage.getPatterns(userId, startDate, endDate);
      return res.json(patterns);
    } catch (error) {
      console.error("Error fetching patterns:", error);
      return res.status(500).json({ error: "Failed to fetch patterns" });
    }
  });

  app.get("/api/subscription", requireAuth, async (req: AuthedRequest, res: Response) => {
    try {
      const userId = req.authUserId!;
      const user = await storage.getUser(userId);
      const sessionCount = await storage.getSessionCount(userId);

      return res.json({
        subscriptionStatus: user?.subscriptionStatus || "free",
        subscriptionTier: user?.subscriptionTier || null,
        sessionCount,
        freeEntriesRemaining: null,
        isSubscribed: false,
      });
    } catch (error) {
      console.error("Error fetching subscription:", error);
      return res.status(500).json({ error: "Failed to fetch subscription status" });
    }
  });

  app.delete("/api/account", requireAuth, async (req: AuthedRequest, res: Response) => {
    try {
      const userId = req.authUserId!;
      await storage.deleteAccount(userId);

      res.clearCookie("userId", { path: "/" });

      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting account:", error);
      return res.status(500).json({ error: "Failed to delete account. Please try again." });
    }
  });

  return httpServer;
}