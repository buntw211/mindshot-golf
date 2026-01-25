import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSessionSchema } from "@shared/schema";
import { z } from "zod";
import { isAuthenticated } from "./replit_integrations/auth";
import { stripeService } from "./stripeService";
import { getStripePublishableKey } from "./stripeClient";
import { db } from "./db";
import { sql } from "drizzle-orm";

const FREE_JOURNAL_LIMIT = 3;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
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
      const isPremium = user.subscriptionStatus === "active";
      const canCreateJournal = isPremium || journalCount < FREE_JOURNAL_LIMIT;
      const remainingFreeEntries = Math.max(0, FREE_JOURNAL_LIMIT - journalCount);

      res.json({
        isPremium,
        journalCount,
        canCreateJournal,
        remainingFreeEntries,
        freeLimit: FREE_JOURNAL_LIMIT,
        subscriptionStatus: user.subscriptionStatus || null,
        stripeCustomerId: user.stripeCustomerId || null
      });
    } catch (error) {
      console.error("Error fetching membership:", error);
      res.status(500).json({ error: "Failed to fetch membership status" });
    }
  });

  app.post("/api/checkout", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const email = req.user?.claims?.email;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripeService.createCustomer(email || "", userId);
        await storage.updateUserStripeInfo(userId, { stripeCustomerId: customer.id });
        customerId = customer.id;
      }

      const pricesResult = await db.execute(
        sql`SELECT id FROM stripe.prices WHERE active = true ORDER BY unit_amount ASC LIMIT 1`
      );
      
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
      const isPremium = user.subscriptionStatus === "active";
      
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
      await storage.deleteSession(req.params.id);
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
      const journalCount = parseInt(user?.journalCount || "0", 10);
      const isPremium = user?.subscriptionStatus === "active";
      
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
