import { pgTable, text, varchar, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const selfRatingsSchema = z.object({
  confidence: z.number().min(1).max(10).optional(),
  focus: z.number().min(1).max(10).optional(),
  frustration: z.number().min(1).max(10).optional(),
  anxiety: z.number().min(1).max(10).optional(),
  patience: z.number().min(1).max(10).optional(),
  "decision-making": z.number().min(1).max(10).optional(),
  "self-talk": z.number().min(1).max(10).optional(),
  pressure: z.number().min(1).max(10).optional(),
  expectations: z.number().min(1).max(10).optional(),
  acceptance: z.number().min(1).max(10).optional(),
});

export type SelfRatings = z.infer<typeof selfRatingsSchema>;

export const sessionTypes = ["play", "practice"] as const;
export type SessionType = typeof sessionTypes[number];

export const thoughtCategories = [
  "confidence",
  "focus",
  "frustration",
  "anxiety",
  "patience",
  "decision-making",
  "self-talk",
  "pressure",
  "expectations",
  "acceptance"
] as const;
export type ThoughtCategory = typeof thoughtCategories[number];

export const journalEntries = pgTable("journal_entries", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }),
  type: varchar("type", { length: 20 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  courseName: text("course_name"),
  score: integer("score"),
  practiceType: text("practice_type"),
  duration: integer("duration"),
  overallMood: integer("overall_mood"),
  overallFocus: integer("overall_focus"),
  preRoundMindset: text("pre_round_mindset"),
  preRoundRoutine: text("pre_round_routine"),
  keyMoments: text("key_moments"),
  decisionsReflection: text("decisions_reflection"),
  emotionalHighs: text("emotional_highs"),
  emotionalLows: text("emotional_lows"),
  focusQuality: text("focus_quality"),
  thoughtProcess: text("thought_process"),
  lessonsLearned: text("lessons_learned"),
  gratitude: text("gratitude"),
  nextSessionGoals: text("next_session_goals"),
  swingFocus: text("swing_focus"),
  confidenceBefore: integer("confidence_before"),
  confidenceAfter: integer("confidence_after"),
  selfRatings: jsonb("self_ratings"),
  createdAt: varchar("created_at", { length: 30 }).notNull()
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({
  id: true,
  createdAt: true
});

export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;

// Backwards compatibility aliases
export const sessions = journalEntries;
export const insertSessionSchema = insertJournalEntrySchema;
export type InsertSession = InsertJournalEntry;
export type Session = JournalEntry;

export interface PatternSummary {
  category: ThoughtCategory;
  count: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  trend: "improving" | "stable" | "declining";
}

export interface MoodFocusTrend {
  date: string;
  mood: number;
  focus: number;
  type: SessionType;
}

// Re-export auth schema
export * from "./models/auth";

export interface DashboardStats {
  totalSessions: number;
  playSessions: number;
  practiceSessions: number;
  avgMood: number;
  avgFocus: number;
  topPatterns: PatternSummary[];
  recentSessions: Session[];
  moodFocusTrends: MoodFocusTrend[];
}
