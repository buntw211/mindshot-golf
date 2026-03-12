import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSessionSchema } from "@shared/schema";
import { z } from "zod";
import { isAuthenticated } from "./replit_integrations/auth";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import express from "express";
import { getUncachableStripeClient } from "./stripeClient";
import { sql } from "drizzle-orm";
import { db } from "./db";
import OpenAI from "openai";

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
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
    cb(null, allowed.includes(file.mimetype));
  },
});

const FREE_ENTRY_LIMIT = 4;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.use("/uploads", express.static(uploadDir));

  app.post("/api/upload/scorecard", isAuthenticated, upload.single("scorecard"), (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided or invalid file type" });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ url: imageUrl });
  });

  app.get("/api/sessions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const sessions = await storage.getSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.get("/api/sessions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const session = await storage.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      const userId = req.user?.claims?.sub;
      if (session.userId !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      res.json(session);
    } catch (error) {
      console.error("Error fetching session:", error);
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  app.post("/api/sessions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;

      let user = await storage.getUser(userId);
      let isSubscribed = user?.subscriptionStatus === "active";

      if (!isSubscribed && user?.stripeCustomerId) {
        const subResult = await db.execute(
          sql`SELECT status FROM stripe.subscriptions WHERE customer = ${user.stripeCustomerId} AND (status = 'active' OR status = 'trialing') LIMIT 1`
        );
        if (subResult.rows.length > 0) {
          await storage.updateUserSubscription(userId, { subscriptionStatus: "active" });
          isSubscribed = true;
        }
      }

      if (!isSubscribed) {
        const sessionCount = await storage.getSessionCount(userId);
        if (sessionCount >= FREE_ENTRY_LIMIT) {
          return res.status(403).json({ 
            error: "Free entry limit reached",
            message: "You've used all 4 free journal entries. Subscribe to continue journaling.",
            limitReached: true
          });
        }
      }

      const validatedData = insertSessionSchema.parse(req.body);
      const session = await storage.createSession(validatedData, userId);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid session data", details: error.errors });
      }
      console.error("Error creating session:", error);
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  app.patch("/api/sessions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      const userId = req.user?.claims?.sub;
      if (session.userId !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      const updated = await storage.updateSession(sessionId, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating session:", error);
      res.status(500).json({ error: "Failed to update session" });
    }
  });

  app.delete("/api/sessions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      const userId = req.user?.claims?.sub;
      if (session.userId !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      await storage.deleteSession(sessionId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting session:", error);
      res.status(500).json({ error: "Failed to delete session" });
    }
  });

  app.post("/api/sessions/:id/insights", isAuthenticated, async (req: any, res) => {
    try {
      const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      const userId = req.user?.claims?.sub;
      if (session.userId !== userId) {
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
      console.log("AI insights response:", JSON.stringify({ content: choice?.content?.substring(0, 100), refusal: choice?.refusal, finishReason: response.choices[0]?.finish_reason }));
      const insights = choice?.content || choice?.refusal || "Unable to generate insights at this time.";

      await storage.updateSession(sessionId, { aiInsights: insights });

      res.json({ insights });
    } catch (error) {
      console.error("Error generating AI insights:", error);
      res.status(500).json({ error: "Failed to generate insights" });
    }
  });

  app.get("/api/dashboard", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/patterns", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const patterns = await storage.getPatterns(userId, startDate, endDate);
      res.json(patterns);
    } catch (error) {
      console.error("Error fetching patterns:", error);
      res.status(500).json({ error: "Failed to fetch patterns" });
    }
  });

  app.get("/api/subscription", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      let user = await storage.getUser(userId);
      const sessionCount = await storage.getSessionCount(userId);

      if (user?.stripeCustomerId) {
        const subResult = await db.execute(
          sql`SELECT id, status, items FROM stripe.subscriptions WHERE customer = ${user.stripeCustomerId} ORDER BY created DESC LIMIT 1`
        );
        if (subResult.rows.length > 0) {
          const sub = subResult.rows[0] as any;
          const status = sub.status === "active" || sub.status === "trialing" ? "active" : "canceled";
          let tier: string | null = null;
          const items = typeof sub.items === 'string' ? JSON.parse(sub.items) : sub.items;
          if (items?.data?.[0]?.price?.recurring?.interval) {
            tier = items.data[0].price.recurring.interval === 'year' ? 'yearly' : 'monthly';
          }
          if (user.subscriptionStatus !== status || user.subscriptionTier !== tier) {
            await storage.updateUserSubscription(userId, { subscriptionStatus: status, subscriptionTier: tier });
            user = await storage.getUser(userId);
          }
        }
      }
      
      res.json({
        subscriptionStatus: user?.subscriptionStatus || "free",
        subscriptionTier: user?.subscriptionTier || null,
        sessionCount,
        freeEntriesRemaining: Math.max(0, FREE_ENTRY_LIMIT - sessionCount),
        isSubscribed: user?.subscriptionStatus === "active",
      });
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ error: "Failed to fetch subscription status" });
    }
  });

  app.post("/api/checkout", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const userEmail = req.user?.claims?.email;
      const { plan } = req.body;

      if (!plan || !["monthly", "yearly"].includes(plan)) {
        return res.status(400).json({ error: "Invalid plan. Must be 'monthly' or 'yearly'" });
      }

      const stripe = await getUncachableStripeClient();
      let user = await storage.getUser(userId);

      let customerId = user?.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: { userId },
        });
        customerId = customer.id;
        await storage.updateUserSubscription(userId, { stripeCustomerId: customer.id });
      }

      const priceResult = await db.execute(
        sql`SELECT id, recurring, unit_amount FROM stripe.prices WHERE active = true AND recurring IS NOT NULL ORDER BY unit_amount ASC`
      );
      
      const prices = priceResult.rows;
      let priceId: string;
      
      if (plan === "monthly") {
        const monthlyPrice = prices.find((p: any) => {
          const recurring = typeof p.recurring === 'string' ? JSON.parse(p.recurring) : p.recurring;
          return recurring?.interval === 'month';
        });
        priceId = monthlyPrice?.id as string;
      } else {
        const yearlyPrice = prices.find((p: any) => {
          const recurring = typeof p.recurring === 'string' ? JSON.parse(p.recurring) : p.recurring;
          return recurring?.interval === 'year';
        });
        priceId = yearlyPrice?.id as string;
      }

      if (!priceId) {
        return res.status(500).json({ error: "Price not found. Products may not be set up yet." });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${baseUrl}/?checkout=success`,
        cancel_url: `${baseUrl}/?checkout=cancel`,
        subscription_data: {
          metadata: { userId },
        },
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  app.post("/api/manage-subscription", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);

      if (!user?.stripeCustomerId) {
        return res.status(400).json({ error: "No subscription found" });
      }

      const stripe = await getUncachableStripeClient();
      const baseUrl = `${req.protocol}://${req.get('host')}`;

      let customerId = user.stripeCustomerId;

      // Try to create the portal session; if the stored customer ID is stale,
      // fall back to searching Stripe by email and update our record.
      try {
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${baseUrl}/`,
        });
        return res.json({ url: portalSession.url });
      } catch (stripeErr: any) {
        if (stripeErr?.code !== "resource_missing") throw stripeErr;

        // Customer ID is stale — try to find the real customer by email
        if (user.email) {
          const customers = await stripe.customers.list({ email: user.email, limit: 1 });
          if (customers.data.length > 0) {
            customerId = customers.data[0].id;
            await storage.updateUserSubscription(userId, { stripeCustomerId: customerId });
            const portalSession = await stripe.billingPortal.sessions.create({
              customer: customerId,
              return_url: `${baseUrl}/`,
            });
            return res.json({ url: portalSession.url });
          }
        }

        // No valid customer found — clear stale data
        await storage.updateUserSubscription(userId, {
          stripeCustomerId: undefined,
          subscriptionStatus: "free",
          subscriptionTier: null,
        });
        return res.status(400).json({ error: "Subscription not found. Your account has been reset to free." });
      }
    } catch (error) {
      console.error("Error creating portal session:", error);
      res.status(500).json({ error: "Failed to open subscription management. Please try again." });
    }
  });

  app.post("/api/sync-subscription", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);

      if (!user?.stripeCustomerId) {
        return res.json({ subscriptionStatus: "free" });
      }

      const subResult = await db.execute(
        sql`SELECT id, status, items FROM stripe.subscriptions WHERE customer = ${user.stripeCustomerId} ORDER BY created DESC LIMIT 1`
      );

      if (subResult.rows.length > 0) {
        const sub = subResult.rows[0] as any;
        const status = sub.status === "active" || sub.status === "trialing" ? "active" : "canceled";
        
        let tier: string | null = null;
        const items = typeof sub.items === 'string' ? JSON.parse(sub.items) : sub.items;
        if (items?.data?.[0]?.price?.recurring?.interval) {
          tier = items.data[0].price.recurring.interval === 'year' ? 'yearly' : 'monthly';
        }

        await storage.updateUserSubscription(userId, {
          subscriptionStatus: status,
          subscriptionTier: tier,
        });

        return res.json({ subscriptionStatus: status, subscriptionTier: tier });
      }

      return res.json({ subscriptionStatus: "free" });
    } catch (error) {
      console.error("Error syncing subscription:", error);
      res.status(500).json({ error: "Failed to sync subscription" });
    }
  });

  return httpServer;
}
