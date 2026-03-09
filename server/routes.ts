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

  app.delete("/api/sessions/:id", isAuthenticated, async (req, res) => {
    try {
      const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await storage.deleteSession(sessionId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting session:", error);
      res.status(500).json({ error: "Failed to delete session" });
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
      const patterns = await storage.getPatterns(userId);
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
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${baseUrl}/`,
      });

      res.json({ url: portalSession.url });
    } catch (error) {
      console.error("Error creating portal session:", error);
      res.status(500).json({ error: "Failed to create portal session" });
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
