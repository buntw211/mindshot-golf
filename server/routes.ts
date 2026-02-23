import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSessionSchema } from "@shared/schema";
import { z } from "zod";
import { isAuthenticated } from "./replit_integrations/auth";
import { stripeService } from "./stripeService";
import { getStripePublishableKey, getUncachableStripeClient } from "./stripeClient";
import { db } from "./db";
import { sql } from "drizzle-orm";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import express from "express";

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

const FREE_JOURNAL_LIMIT = 3;

const checkoutSchema = z.object({
  interval: z.enum(["month", "year"]).optional(),
});

async function checkPremiumStatus(userId: string, user: any): Promise<{ isPremium: boolean; subscriptionStatus: string | null }> {
  let isPremium = false;
  let subscriptionStatus: string | null = null;

  if (user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing") {
    isPremium = true;
    subscriptionStatus = user.subscriptionStatus;
    return { isPremium, subscriptionStatus };
  }

  if (user.stripeCustomerId) {
    const subResult = await db.execute(
      sql`SELECT status FROM stripe.subscriptions 
          WHERE customer = ${user.stripeCustomerId} 
          AND status IN ('active', 'trialing')
          LIMIT 1`
    );
    if (subResult.rows.length > 0) {
      isPremium = true;
      subscriptionStatus = subResult.rows[0].status as string;
    }
  }

  if (!isPremium) {
    const subResult = await db.execute(
      sql`SELECT s.status FROM stripe.subscriptions s
          JOIN stripe.customers c ON s.customer = c.id
          WHERE c.metadata->>'userId' = ${userId}
          AND s.status IN ('active', 'trialing')
          LIMIT 1`
    );
    if (subResult.rows.length > 0) {
      isPremium = true;
      subscriptionStatus = subResult.rows[0].status as string;
    }
  }

  if (!isPremium) {
    try {
      const stripe = await getUncachableStripeClient();
      const customers = await stripe.customers.search({
        query: `metadata['userId']:'${userId}'`,
      });
      if (customers.data.length > 0) {
        const customerId = customers.data[0].id;
        if (!user.stripeCustomerId) {
          await storage.updateUserStripeInfo(userId, { stripeCustomerId: customerId });
        }
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: 'active',
          limit: 1,
        });
        if (subscriptions.data.length > 0) {
          isPremium = true;
          subscriptionStatus = subscriptions.data[0].status;
          await storage.updateUserStripeInfo(userId, {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptions.data[0].id,
            subscriptionStatus: 'active'
          });
        } else {
          const trialingSubscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'trialing',
            limit: 1,
          });
          if (trialingSubscriptions.data.length > 0) {
            isPremium = true;
            subscriptionStatus = trialingSubscriptions.data[0].status;
            await storage.updateUserStripeInfo(userId, {
              stripeCustomerId: customerId,
              stripeSubscriptionId: trialingSubscriptions.data[0].id,
              subscriptionStatus: 'trialing'
            });
          }
        }
      }
    } catch (stripeError) {
      console.error("Stripe API fallback error:", stripeError);
    }
  }

  return { isPremium, subscriptionStatus };
}

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

  app.get("/api/stripe/publishable-key", async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Error getting Stripe publishable key:", error);
      res.status(500).json({ error: "Failed to get Stripe publishable key" });
    }
  });

  app.get("/api/membership", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const journalCount = parseInt(user.journalCount || "0", 10);
      const { isPremium, subscriptionStatus } = await checkPremiumStatus(userId, user);
      
      const canCreateJournal = isPremium || journalCount < FREE_JOURNAL_LIMIT;
      const remainingFreeEntries = Math.max(0, FREE_JOURNAL_LIMIT - journalCount);

      res.json({
        isPremium,
        journalCount,
        canCreateJournal,
        remainingFreeEntries,
        freeLimit: FREE_JOURNAL_LIMIT,
        subscriptionStatus: subscriptionStatus || user.subscriptionStatus || null,
        stripeCustomerId: user.stripeCustomerId || null
      });
    } catch (error) {
      console.error("Error fetching membership:", error);
      res.status(500).json({ error: "Failed to fetch membership status" });
    }
  });

  // Get available prices for display in UI
  app.get("/api/prices", async (req, res) => {
    try {
      const pricesResult = await db.execute(
        sql`SELECT id, unit_amount, currency, recurring->>'interval' as interval 
            FROM stripe.prices 
            WHERE active = true 
            ORDER BY unit_amount ASC`
      );
      
      const prices = pricesResult.rows.map((row: any) => ({
        id: row.id,
        amount: row.unit_amount / 100, // Convert from cents
        currency: row.currency,
        interval: row.interval
      }));
      
      res.json({ prices });
    } catch (error) {
      console.error("Error fetching prices:", error);
      res.status(500).json({ error: "Failed to fetch prices" });
    }
  });

  app.post("/api/checkout", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const email = req.user?.claims?.email;
      const user = await storage.getUser(userId);
      
      // Validate request body
      const parseResult = checkoutSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request body" });
      }
      const { interval } = parseResult.data;
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripeService.createCustomer(email || "", userId);
        await storage.updateUserStripeInfo(userId, { stripeCustomerId: customer.id });
        customerId = customer.id;
      }

      // Query for the specific interval price, fallback to any active price
      let pricesResult;
      if (interval === 'year' || interval === 'month') {
        pricesResult = await db.execute(
          sql`SELECT id FROM stripe.prices 
              WHERE active = true AND recurring->>'interval' = ${interval} 
              ORDER BY unit_amount ASC LIMIT 1`
        );
      }
      
      // Fallback to any active price if specific interval not found
      if (!pricesResult || pricesResult.rows.length === 0) {
        pricesResult = await db.execute(
          sql`SELECT id FROM stripe.prices WHERE active = true ORDER BY unit_amount ASC LIMIT 1`
        );
      }
      
      if (pricesResult.rows.length === 0) {
        return res.status(400).json({ error: "No active prices found. Please create a subscription product in Stripe." });
      }

      const priceId = pricesResult.rows[0].id as string;

      const session = await stripeService.createCheckoutSession(
        customerId,
        priceId,
        `${req.protocol}://${req.get('host')}/?checkout=success`,
        `${req.protocol}://${req.get('host')}/?checkout=cancel`
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  app.post("/api/customer-portal", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ error: "No subscription found" });
      }

      const session = await stripeService.createCustomerPortalSession(
        user.stripeCustomerId,
        `${req.protocol}://${req.get('host')}/`
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating customer portal session:", error);
      res.status(500).json({ error: "Failed to create customer portal session" });
    }
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
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const journalCount = parseInt(user.journalCount || "0", 10);
      const { isPremium } = await checkPremiumStatus(userId, user);
      
      if (!isPremium && journalCount >= FREE_JOURNAL_LIMIT) {
        return res.status(403).json({ 
          error: "Free trial limit reached",
          message: "Upgrade to Premium to create unlimited journal entries",
          requiresUpgrade: true
        });
      }

      const validatedData = insertSessionSchema.parse(req.body);
      const session = await storage.createSession(validatedData, userId);
      
      await storage.incrementJournalCount(userId);
      
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid session data", details: error.errors });
      }
      console.error("Error creating session:", error);
      res.status(500).json({ error: "Failed to create session" });
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
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const journalCount = parseInt(user.journalCount || "0", 10);
      const { isPremium } = await checkPremiumStatus(userId, user);
      
      if (!isPremium && journalCount > FREE_JOURNAL_LIMIT) {
        return res.status(403).json({ 
          error: "Premium feature",
          message: "Upgrade to Premium to access pattern analysis",
          requiresUpgrade: true
        });
      }
      
      const patterns = await storage.getPatterns(userId);
      res.json(patterns);
    } catch (error) {
      console.error("Error fetching patterns:", error);
      res.status(500).json({ error: "Failed to fetch patterns" });
    }
  });

  return httpServer;
}
