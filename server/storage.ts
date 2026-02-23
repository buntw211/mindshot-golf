import { 
  journalEntries, 
  type JournalEntry, 
  type InsertJournalEntry,
  type PatternSummary,
  type DashboardStats,
  type MoodFocusTrend,
  type ThoughtCategory,
  thoughtCategories,
  users,
  type User
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

// Backwards compatibility type aliases
import { randomUUID } from "crypto";

export interface IStorage {
  getSessions(userId?: string): Promise<JournalEntry[]>;
  getSession(id: string): Promise<JournalEntry | undefined>;
  createSession(session: InsertJournalEntry, userId?: string): Promise<JournalEntry>;
  updateSession(id: string, data: Partial<InsertJournalEntry>): Promise<JournalEntry | undefined>;
  deleteSession(id: string): Promise<void>;
  getPatterns(userId?: string): Promise<PatternSummary[]>;
  getDashboardStats(userId?: string): Promise<DashboardStats>;
  getUser(id: string): Promise<User | undefined>;
  updateUserStripeInfo(userId: string, stripeInfo: { stripeCustomerId?: string; stripeSubscriptionId?: string; subscriptionStatus?: string }): Promise<User | undefined>;
  incrementJournalCount(userId: string): Promise<number>;
  getUserJournalCount(userId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getSessions(userId?: string): Promise<JournalEntry[]> {
    if (userId) {
      return await db.select().from(journalEntries).where(eq(journalEntries.userId, userId)).orderBy(desc(journalEntries.date));
    }
    return await db.select().from(journalEntries).orderBy(desc(journalEntries.date));
  }

  async getSession(id: string): Promise<JournalEntry | undefined> {
    const [session] = await db.select().from(journalEntries).where(eq(journalEntries.id, id));
    return session || undefined;
  }

  async createSession(insertSession: InsertJournalEntry, userId?: string): Promise<JournalEntry> {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    const [session] = await db
      .insert(journalEntries)
      .values({ ...insertSession, id, createdAt, userId: userId || null })
      .returning();
    return session;
  }

  async updateSession(id: string, data: Partial<InsertJournalEntry>): Promise<JournalEntry | undefined> {
    const [updated] = await db
      .update(journalEntries)
      .set(data)
      .where(eq(journalEntries.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSession(id: string): Promise<void> {
    await db.delete(journalEntries).where(eq(journalEntries.id, id));
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async updateUserStripeInfo(userId: string, stripeInfo: { stripeCustomerId?: string; stripeSubscriptionId?: string; subscriptionStatus?: string }): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...stripeInfo, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async incrementJournalCount(userId: string): Promise<number> {
    const user = await this.getUser(userId);
    const currentCount = parseInt(user?.journalCount || "0", 10);
    const newCount = currentCount + 1;
    await db
      .update(users)
      .set({ journalCount: String(newCount), updatedAt: new Date() })
      .where(eq(users.id, userId));
    return newCount;
  }

  async getUserJournalCount(userId: string): Promise<number> {
    const user = await this.getUser(userId);
    return parseInt(user?.journalCount || "0", 10);
  }

  private analyzeSessionContent(session: JournalEntry): Map<ThoughtCategory, { positive: number; negative: number; neutral: number }> {
    const result = new Map<ThoughtCategory, { positive: number; negative: number; neutral: number }>();
    
    for (const category of thoughtCategories) {
      result.set(category, { positive: 0, negative: 0, neutral: 0 });
    }

    const textFields = [
      session.preRoundMindset,
      session.preRoundRoutine,
      session.keyMoments,
      session.decisionsReflection,
      session.emotionalHighs,
      session.emotionalLows,
      session.focusQuality,
      session.thoughtProcess,
      session.lessonsLearned,
      session.gratitude,
      session.nextSessionGoals
    ].filter(Boolean).join(" ").toLowerCase();

    const positiveKeywords = ["confident", "focused", "calm", "trust", "patient", "accept", "grateful", "joy", "proud", "committed", "present", "positive", "good", "great", "excellent", "improved", "breakthrough"];
    const negativeKeywords = ["frustrated", "anxious", "nervous", "doubt", "impatient", "angry", "disappointed", "rushed", "distracted", "worried", "pressure", "bad", "terrible", "choke", "mess"];

    const categoryKeywords: Record<ThoughtCategory, string[]> = {
      "confidence": ["confident", "believe", "trust", "doubt", "uncertain", "capable", "ability"],
      "focus": ["focus", "concentrate", "present", "distract", "wander", "attention", "aware"],
      "frustration": ["frustrat", "angry", "annoyed", "upset", "irritat"],
      "anxiety": ["anxious", "nervous", "worry", "fear", "scared", "tense"],
      "patience": ["patient", "impatient", "rush", "slow", "wait", "calm"],
      "decision-making": ["decision", "choice", "commit", "select", "option", "strategy"],
      "self-talk": ["tell myself", "said to myself", "thought to myself", "inner", "voice"],
      "pressure": ["pressure", "stress", "stakes", "important", "crucial", "must"],
      "expectations": ["expect", "should", "supposed", "standard", "goal"],
      "acceptance": ["accept", "let go", "move on", "forgive", "embrace"]
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      const cat = category as ThoughtCategory;
      const counts = result.get(cat)!;
      
      for (const keyword of keywords) {
        if (textFields.includes(keyword)) {
          const hasPositiveContext = positiveKeywords.some(pk => textFields.includes(pk));
          const hasNegativeContext = negativeKeywords.some(nk => textFields.includes(nk));
          
          if (hasPositiveContext && !hasNegativeContext) {
            counts.positive++;
          } else if (hasNegativeContext && !hasPositiveContext) {
            counts.negative++;
          } else {
            counts.neutral++;
          }
        }
      }
    }

    return result;
  }

  async getPatterns(userId?: string): Promise<PatternSummary[]> {
    const allSessions = await this.getSessions(userId);
    
    const aggregated = new Map<ThoughtCategory, { positive: number; negative: number; neutral: number }>();
    for (const category of thoughtCategories) {
      aggregated.set(category, { positive: 0, negative: 0, neutral: 0 });
    }

    for (const session of allSessions) {
      const sessionPatterns = this.analyzeSessionContent(session);
      for (const [category, counts] of sessionPatterns) {
        const agg = aggregated.get(category)!;
        agg.positive += counts.positive;
        agg.negative += counts.negative;
        agg.neutral += counts.neutral;
      }
    }

    const patterns: PatternSummary[] = [];
    for (const [category, counts] of aggregated) {
      const total = counts.positive + counts.negative + counts.neutral;
      if (total > 0) {
        const positiveRatio = counts.positive / total;
        let trend: "improving" | "stable" | "declining" = "stable";
        if (positiveRatio > 0.6) {
          trend = "improving";
        } else if (positiveRatio < 0.4) {
          trend = "declining";
        }
        
        patterns.push({
          category,
          count: total,
          positiveCount: counts.positive,
          negativeCount: counts.negative,
          neutralCount: counts.neutral,
          trend
        });
      }
    }

    return patterns.sort((a, b) => b.count - a.count);
  }

  async getDashboardStats(userId?: string): Promise<DashboardStats> {
    const allSessions = await this.getSessions(userId);
    const patterns = await this.getPatterns(userId);
    
    const playSessions = allSessions.filter(s => s.type === "play");
    const practiceSessions = allSessions.filter(s => s.type === "practice");
    
    const sessionsWithMood = allSessions.filter(s => s.overallMood !== null);
    const sessionsWithFocus = allSessions.filter(s => s.overallFocus !== null);
    
    const avgMood = sessionsWithMood.length > 0
      ? sessionsWithMood.reduce((sum, s) => sum + (s.overallMood || 0), 0) / sessionsWithMood.length
      : 0;
    
    const avgFocus = sessionsWithFocus.length > 0
      ? sessionsWithFocus.reduce((sum, s) => sum + (s.overallFocus || 0), 0) / sessionsWithFocus.length
      : 0;

    const moodFocusTrends: MoodFocusTrend[] = allSessions
      .filter(s => s.overallMood !== null && s.overallFocus !== null)
      .map(s => ({
        date: s.date,
        mood: s.overallMood!,
        focus: s.overallFocus!,
        type: s.type as "play" | "practice"
      }))
      .slice(0, 10);
    
    return {
      totalSessions: allSessions.length,
      playSessions: playSessions.length,
      practiceSessions: practiceSessions.length,
      avgMood,
      avgFocus,
      topPatterns: patterns.slice(0, 5),
      recentSessions: allSessions.slice(0, 5),
      moodFocusTrends
    };
  }
}

export const storage = new DatabaseStorage();
