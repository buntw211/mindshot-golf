import { pgTable, text, varchar, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 36 }).primaryKey(),
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
  createdAt: varchar("created_at", { length: 30 }).notNull()
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true
});

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

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
