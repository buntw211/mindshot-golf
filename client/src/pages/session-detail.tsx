import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams, Link } from "wouter";
import { format } from "date-fns";
import {
  ArrowLeft,
  BookOpen,
  Brain,
  Calendar,
  Camera,
  CheckCircle,
  Clock,
  Focus,
  Heart,
  PenLine,
  Pencil,
  RefreshCw,
  Save,
  Smile,
  Sparkles,
  Target,
  Trash2,
  X,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { DrivingRangeIcon } from "@/components/driving-range-icon";
import { GolfFlagIcon } from "@/components/golf-flag-icon";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import type { SelfRatings, Session } from "@shared/schema";
import { thoughtCategories, type ThoughtCategory } from "@shared/schema";

type JournalEditData = Record<string, any>;

const ratingLabels: Record<string, string> = {
  confidence: "Confidence",
  focus: "Focus",
  frustration: "Frustration",
  anxiety: "Anxiety",
  patience: "Patience",
  "decision-making": "Decision Making",
  "self-talk": "Self Talk",
  pressure: "Pressure",
  expectations: "Expectations",
  acceptance: "Acceptance",
};

const categoryLabels: Record<
  ThoughtCategory,
  { label: string; lowLabel: string; highLabel: string }
> = {
  confidence: { label: "Confidence", lowLabel: "Doubting", highLabel: "Confident" },
  focus: { label: "Focus", lowLabel: "Scattered", highLabel: "Locked In" },
  frustration: {
    label: "Frustration Management",
    lowLabel: "Easily Frustrated",
    highLabel: "Calm",
  },
  anxiety: { label: "Anxiety Level", lowLabel: "Anxious", highLabel: "Relaxed" },
  patience: { label: "Patience", lowLabel: "Impatient", highLabel: "Patient" },
  "decision-making": {
    label: "Decision Making",
    lowLabel: "Uncertain",
    highLabel: "Decisive",
  },
  "self-talk": {
    label: "Self-Talk Quality",
    lowLabel: "Critical",
    highLabel: "Supportive",
  },
  pressure: { label: "Pressure Handling", lowLabel: "Struggled", highLabel: "Thrived" },
  expectations: {
    label: "Expectations",
    lowLabel: "Unrealistic",
    highLabel: "Balanced",
  },
  acceptance: { label: "Acceptance", lowLabel: "Resisting", highLabel: "Accepting" },
};

const embrHeadingLabels = new Set([
  "Mental Game Summary",
  "Patterns Noticed",
  "Focus / Confidence / Frustration Signals",
  "What This Golfer Can Learn",
  "One Clear Next Step",
  "Practice Focus for Next Session",
  "Mental Read",
  "Signal I Notice",
  "What It Could Mean",
  "Next Move",
  "Embr Note",
]);

function JournalSection({
  title,
  content,
  testId,
  editing,
  field,
  editData,
  onEdit,
}: {
  title: string;
  content: string | null | undefined;
  testId?: string;
  editing?: boolean;
  field?: string;
  editData?: JournalEditData;
  onEdit?: (field: string, value: string) => void;
}) {
  if (!editing && !content) return null;

  return (
    <div className="space-y-2" data-testid={testId}>
      <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
        {title}
      </h3>

      {editing && field && onEdit ? (
        <Textarea
          value={(editData?.[field] as string) || ""}
          onChange={(event) => onEdit(field, event.target.value)}
          className="min-h-[100px] resize-none"
          placeholder={`Enter ${title.toLowerCase()}...`}
          data-testid={testId ? `edit-${testId}` : undefined}
        />
      ) : (
        <p className="text-foreground whitespace-pre-wrap">{content}</p>
      )}
    </div>
  );
}

function SelfRatingsSection({
  ratings,
  editing,
  onRatingChange,
}: {
  ratings: SelfRatings;
  editing?: boolean;
  onRatingChange?: (category: ThoughtCategory, value: number) => void;
}) {
  const entries = Object.entries(ratings || {}).filter(
    ([, value]) => value !== undefined && value !== null
  );

  if (!editing && entries.length === 0) return null;

  if (editing && onRatingChange) {
    return (
      <div className="space-y-3" data-testid="section-self-ratings">
        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
          Self-Assessment Ratings
        </h3>

        <div className="space-y-4">
          {thoughtCategories.map((category) => (
            <div key={category} className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">{categoryLabels[category].label}</Label>
                <span className="text-sm text-muted-foreground">
                  {(ratings?.[category] as number) || 5}/10
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-20 text-right">
                  {categoryLabels[category].lowLabel}
                </span>

                <Slider
                  min={1}
                  max={10}
                  step={1}
                  value={[(ratings?.[category] as number) || 5]}
                  onValueChange={([value]) => onRatingChange(category, value)}
                  className="flex-1"
                  data-testid={`edit-slider-${category}`}
                />

                <span className="text-xs text-muted-foreground w-20">
                  {categoryLabels[category].highLabel}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="section-self-ratings">
      <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
        Self-Assessment Ratings
      </h3>

      <div className="grid gap-3 sm:grid-cols-2">
        {entries.map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between bg-accent/30 rounded-md px-3 py-2"
          >
            <span className="text-sm">{ratingLabels[key] || key}</span>
            <span className="font-semibold">{value}/10</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AiInsightsSection({ session }: { session: Session }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [liveInsights, setLiveInsights] = useState<string | null>(session.aiInsights ?? null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const {
        data: { session: authSession },
      } = await supabase.auth.getSession();

      if (!authSession?.access_token) {
        throw new Error("Missing auth session");
      }

      const response = await fetch(
        "https://yiyrcenwzbpppajvgaln.supabase.co/functions/v1/clever-handler",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${authSession.access_token}`,
            apikey: "sb_publishable_kFR8m3AQ2GDJ5PjM9Yf1DQ_MqtbUG-s",
          },
          body: JSON.stringify({ sessionId: session.id }),
        }
      );

      const text = await response.text();

      if (!response.ok) {
        throw new Error(`Function failed: ${response.status} ${text}`);
      }

      const data = JSON.parse(text);

      if (!data?.insights) {
        throw new Error("No insights returned");
      }

      return data;
    },
    onSuccess: (data) => {
      setLiveInsights(data?.insights ?? null);

      queryClient.setQueryData(["journal_entry", session.id], (old: any) => {
        if (!old) return old;

        return {
          ...old,
          aiInsights: data?.insights ?? old.aiInsights,
          ai_insights: data?.insights ?? old.ai_insights,
        };
      });

      queryClient.invalidateQueries({ queryKey: ["journal_entry", session.id] });

      toast({
        title: "Success",
        description: "AI insights generated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to generate AI insights. Please try again.",
        variant: "destructive",
      });
    },
  });

  const displayedInsights = liveInsights ?? session.aiInsights ?? null;
  const hasInsights = !!displayedInsights;

  const renderMarkdown = (text: string) => {
    const lines = text.split("\n");
    const elements: JSX.Element[] = [];
    let listItems: string[] = [];

    const flushList = () => {
      if (listItems.length === 0) return;

      elements.push(
        <ul key={`list-${elements.length}`} className="space-y-1.5 ml-1">
          {listItems.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <span className="text-primary mt-1.5 shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
      listItems = [];
    };

    lines.forEach((rawLine, index) => {
      const line = rawLine.trim();

      if (!line) {
        flushList();
        return;
      }

      if (line.startsWith("## ")) {
        flushList();
        elements.push(
          <h4
            key={`h-${index}`}
            className="font-semibold text-sm flex items-center gap-2 mt-3 first:mt-0"
          >
            <Brain className="w-3.5 h-3.5 text-primary shrink-0" />
            {line.replace("## ", "")}
          </h4>
        );
        return;
      }

      if (line.startsWith("- ") || line.startsWith("* ") || /^\d+\.\s/.test(line)) {
        listItems.push(line.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, ""));
        return;
      }

      flushList();
      elements.push(
        <p key={`p-${index}`} className="text-sm text-muted-foreground">
          {line}
        </p>
      );
    });

    flushList();
    return elements;
  };

  return (
    <div className="space-y-3" data-testid="section-ai-insights">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          AI-Powered Insights
        </h3>

        {hasInsights && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="text-xs"
            data-testid="button-regenerate-insights"
          >
            <RefreshCw
              className={`w-3 h-3 mr-1 ${generateMutation.isPending ? "animate-spin" : ""}`}
            />
            Regenerate
          </Button>
        )}
      </div>

      {hasInsights ? (
        <div className="bg-gradient-to-br from-primary/5 via-accent/30 to-primary/5 rounded-lg border border-primary/10 p-4 space-y-2">
          {renderMarkdown(displayedInsights)}
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <Sparkles className="w-8 h-8 text-primary/40 mx-auto mb-2" />
          <p className="text-sm font-medium mb-1">Get personalized feedback</p>
          <p className="text-xs text-muted-foreground mb-3">
            AI will analyze your journal entry and ratings to provide tailored mental game
            insights.
          </p>
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            size="sm"
            data-testid="button-generate-insights"
          >
            {generateMutation.isPending ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Generate Insights
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function EmbrReviewSection({ session }: { session: Session }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [liveReview, setLiveReview] = useState<string | null>(session.embrInsights ?? null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        sessionId: session.id,
        type: session.type,
        courseName: session.courseName,
        practiceType: session.practiceType,
        date: session.date,
        score: session.score,
        duration: session.duration,
        overallMood: session.overallMood,
        overallFocus: session.overallFocus,
        journalMode: session.journalMode,
        freeWriting: session.freeWriting,
        preRoundMindset: session.preRoundMindset,
        preRoundMentalState: session.preRoundMentalState,
        preRoundGoals: session.preRoundGoals,
        preRoundRoutine: session.preRoundRoutine,
        focusQuality: session.focusQuality,
        thoughtProcess: session.thoughtProcess,
        keyMoments: session.keyMoments,
        missPattern: session.missPattern,
        strokeGains: session.strokeGains,
        gameCosts: session.gameCosts,
        decisionsReflection: session.decisionsReflection,
        courseManagement: session.courseManagement,
        targetSelection: session.targetSelection,
        emotionalDecisions: session.emotionalDecisions,
        emotionalHighs: session.emotionalHighs,
        emotionalLows: session.emotionalLows,
        adversityResponse: session.adversityResponse,
        routineCommitment: session.routineCommitment,
        joyMoments: session.joyMoments,
        emotionalChallenges: session.emotionalChallenges,
        lessonsLearned: session.lessonsLearned,
        gratitude: session.gratitude,
        nextSessionGoals: session.nextSessionGoals,
        selfRatings: session.selfRatings,
      };

      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id || `mindshot-session-${session.id}`;

      const embrResponse = await fetch("/api/embr/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appId: "mindshot-golf",
          appMode: "mindshot",
          userId,
          message:
            "Generate a calm, practical mental-game review for this golf journal entry. Focus on patterns, pressure response, focus, self-talk, decision-making, and one next move.",
          messages: [],
          appContext: {
            appName: "Mindshot Golf",
            role: "calm mental-game companion for golfers",
          },
          allowedTools: ["openai", "profile-memory", "learning-log"],
          hiddenTools: ["operator-read", "codex", "server-debug", "learning-dashboard"],
          entry: payload,
        }),
      });

      const data = await embrResponse.json();

      if (!embrResponse.ok) {
        throw new Error(data.error || "Embr review failed.");
      }

      const review = data.response || data.content || data.text;

      if (!review) {
        throw new Error("No Embr review returned.");
      }

      const { error: updateError } = await supabase
        .from("journal_entries")
        .update({ embr_insights: review })
        .eq("id", session.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      return review as string;
    },
    onSuccess: (review) => {
      setLiveReview(review);

      queryClient.setQueryData(["journal_entry", session.id], (old: any) => {
        if (!old) return old;

        return {
          ...old,
          embrInsights: review,
          embr_insights: review,
        };
      });

      queryClient.invalidateQueries({ queryKey: ["journal_entry", session.id] });

      toast({
        title: "Embr Review Generated",
        description: "Embr analyzed this journal entry.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Embr review failed",
        description: error?.message || "Could not generate Embr review.",
        variant: "destructive",
      });
    },
  });

  const displayedReview = liveReview ?? session.embrInsights ?? null;
  const reviewLines = (displayedReview ?? "")
    .split("\n")
    .map((line) =>
      line
        .trim()
        .replace(/^#{1,6}\s*/, "")
        .replace(/^\d+\.\s*/, "")
        .replace(/^[-*]\s*/, "")
    )
    .filter(Boolean);

  return (
    <div className="space-y-3" data-testid="section-embr-review">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Embr Mental Game Review
        </h3>

        {displayedReview && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="text-xs"
            data-testid="button-regenerate-embr-review"
          >
            <RefreshCw
              className={`w-3 h-3 mr-1 ${generateMutation.isPending ? "animate-spin" : ""}`}
            />
            Regenerate
          </Button>
        )}
      </div>

      {displayedReview ? (
        <div className="rounded-2xl border bg-background p-4 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h4 className="text-lg font-semibold text-foreground">Embr AI</h4>
              </div>
              <p className="text-sm text-muted-foreground">Your AI Mental-Game Coach</p>
            </div>

            <div className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              Review Complete
            </div>
          </div>

          <div className="rounded-xl border bg-primary/5 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                <h5 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                  Embr Insights
                </h5>
              </div>

              <div className="rounded-full border border-primary/20 bg-background px-3 py-1 text-xs font-medium text-primary">
                Overall {session.overallMood || 5}/10
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Embr reviewed this journal entry and identified the strongest mental-game signals
              from the round.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="rounded-xl border bg-background p-3 text-center space-y-1">
                <Brain className="w-5 h-5 mx-auto text-primary" />
                <div className="text-xs text-muted-foreground">Mindset</div>
                <div className="text-sm font-semibold">{session.overallMood || 5}/10</div>
              </div>

              <div className="rounded-xl border bg-background p-3 text-center space-y-1">
                <Target className="w-5 h-5 mx-auto text-primary" />
                <div className="text-xs text-muted-foreground">Focus</div>
                <div className="text-sm font-semibold">{session.overallFocus || 5}/10</div>
              </div>

              <div className="rounded-xl border bg-background p-3 text-center space-y-1">
                <Heart className="w-5 h-5 mx-auto text-primary" />
                <div className="text-xs text-muted-foreground">Pressure</div>
                <div className="text-sm font-semibold">
                  {(session.selfRatings?.pressure as number) || 5}/10
                </div>
              </div>

              <div className="rounded-xl border bg-background p-3 text-center space-y-1">
                <CheckCircle className="w-5 h-5 mx-auto text-primary" />
                <div className="text-xs text-muted-foreground">Decisions</div>
                <div className="text-sm font-semibold">
                  {(session.selfRatings?.["decision-making"] as number) || 5}/10
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-background p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              <h5 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                Mental Game Review
              </h5>
            </div>

            <div className="space-y-3">
              {reviewLines.map((line, index) => {
                const isHeading = embrHeadingLabels.has(line);

                return (
                  <div key={`${line}-${index}`}>
                    {isHeading ? (
                      <div className="flex items-center gap-2 pt-2 first:pt-0">
                        <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                        <p className="text-sm font-semibold text-foreground">{line}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                        {line}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border bg-primary/5 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <h5 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                Personalized Coaching
              </h5>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>Use one clear pre-round routine.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>Identify what pulled focus away.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>Choose one next-round focus point.</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <Sparkles className="w-8 h-8 text-primary/40 mx-auto mb-2" />
          <p className="text-sm font-medium mb-1">Generate an Embr review</p>
          <p className="text-xs text-muted-foreground mb-3">
            Embr will analyze this journal entry and highlight mental-game patterns.
          </p>
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            size="sm"
            data-testid="button-generate-embr-review"
          >
            {generateMutation.isPending ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Reviewing...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Generate Embr Review
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function mapJournalEntryToSession(data: any): Session {
  return {
    ...data,
    courseName: data.course_name ?? null,
    practiceType: data.practice_type ?? null,
    overallMood: data.overall_mood ?? null,
    overallFocus: data.overall_focus ?? null,
    journalMode: data.journal_mode ?? null,
    freeWriting: data.free_writing ?? null,
    preRoundMentalState: data.pre_round_mental_state ?? null,
    preRoundGoals: data.pre_round_goals ?? null,
    preRoundRoutine: data.pre_round_routine ?? null,
    focusQuality: data.focus_quality ?? null,
    thoughtProcess: data.thought_process ?? null,
    missPattern: data.miss_pattern ?? null,
    strokeGains: data.stroke_gains ?? null,
    gameCosts: data.game_costs ?? null,
    courseManagement: data.course_management ?? null,
    targetSelection: data.target_selection ?? null,
    emotionalDecisions: data.emotional_decisions ?? null,
    adversityResponse: data.adversity_response ?? null,
    routineCommitment: data.routine_commitment ?? null,
    joyMoments: data.joy_moments ?? null,
    emotionalChallenges: data.emotional_challenges ?? null,
    lessonsLearned: data.lessons_learned ?? null,
    nextSessionGoals: data.next_session_goals ?? null,
    selfRatings: data.self_ratings ?? null,
    scorecardImage: data.scorecard_image ?? null,
    confidenceBefore: data.confidence_before ?? null,
    confidenceAfter: data.confidence_after ?? null,
    swingFocus: data.swing_focus ?? null,
    keyMoments: data.key_moments ?? null,
    decisionsReflection: data.decisions_reflection ?? null,
    preRoundMindset: data.pre_round_mindset ?? null,
    gratitude: data.gratitude ?? null,
    emotionalHighs: data.emotional_highs ?? null,
    emotionalLows: data.emotional_lows ?? null,
    aiInsights: data.ai_insights ?? null,
    embrInsights: data.embr_insights ?? null,
  } as Session;
}

export default function SessionDetail({ id }: { id?: string }) {
  const params = useParams<{ id: string }>();
  const entryId = id || params.id;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<JournalEditData>({});
  const [scorecardPreview, setScorecardPreview] = useState<string | null>(null);

  const {
    data: session,
    isLoading,
    error: sessionError,
  } = useQuery<Session | null>({
    queryKey: ["journal_entry", entryId],
    enabled: Boolean(entryId),
    queryFn: async () => {
      if (!entryId) {
        throw new Error("Missing entry ID.");
      }

      const fetchPromise = supabase
        .from("journal_entries")
        .select("*")
        .eq("id", entryId)
        .maybeSingle();

      const result = (await Promise.race([
        fetchPromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Detail fetch timeout")), 8000)
        ),
      ])) as any;

      const { data, error } = result;

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        return null;
      }

      return mapJournalEntryToSession(data);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!entryId) {
        throw new Error("Missing entry ID.");
      }

      const { error } = await supabase.from("journal_entries").delete().eq("id", entryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal_entries_history"] });
      toast({
        title: "Entry Deleted",
        description: "Your journal entry has been removed.",
      });
      navigate("/history");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const targetEntryId = entryId || session?.id;

      if (!targetEntryId) {
        throw new Error("Missing entry ID.");
      }

      const payload = {
        course_name: data.courseName || null,
        practice_type: data.practiceType || null,
        date: data.date || null,
        score: data.score ?? null,
        duration: data.duration ?? null,
        overall_mood: data.overallMood ?? null,
        overall_focus: data.overallFocus ?? null,
        journal_mode: data.journalMode || null,
        free_writing: data.freeWriting || null,
        pre_round_mindset: data.preRoundMindset || null,
        pre_round_mental_state: data.preRoundMentalState || null,
        pre_round_goals: data.preRoundGoals || null,
        pre_round_routine: data.preRoundRoutine || null,
        focus_quality: data.focusQuality || null,
        thought_process: data.thoughtProcess || null,
        key_moments: data.keyMoments || null,
        miss_pattern: data.missPattern || null,
        stroke_gains: data.strokeGains || null,
        game_costs: data.gameCosts || null,
        decisions_reflection: data.decisionsReflection || null,
        course_management: data.courseManagement || null,
        target_selection: data.targetSelection || null,
        emotional_decisions: data.emotionalDecisions || null,
        emotional_highs: data.emotionalHighs || null,
        emotional_lows: data.emotionalLows || null,
        joy_moments: data.joyMoments || null,
        emotional_challenges: data.emotionalChallenges || null,
        adversity_response: data.adversityResponse || null,
        routine_commitment: data.routineCommitment || null,
        lessons_learned: data.lessonsLearned || null,
        gratitude: data.gratitude || null,
        next_session_goals: data.nextSessionGoals || null,
        swing_focus: data.swingFocus || null,
        confidence_before: data.confidenceBefore ?? null,
        confidence_after: data.confidenceAfter ?? null,
        self_ratings: data.selfRatings || null,
        scorecard_image: data.scorecardImage || null,
      };

      const { data: updated, error } = await supabase
        .from("journal_entries")
        .update(payload)
        .eq("id", targetEntryId)
        .select();

      if (error) {
        throw new Error(error.message);
      }

      if (!updated || updated.length === 0) {
        throw new Error("No entry was updated. Check the entry ID or permissions.");
      }

      return mapJournalEntryToSession(updated[0]);
    },
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(["journal_entry", entryId], updatedSession);
      queryClient.invalidateQueries({ queryKey: ["journal_entry", entryId] });
      queryClient.invalidateQueries({ queryKey: ["journal_entries_history"] });

      setEditing(false);
      setEditData({});

      toast({
        title: "Entry Updated",
        description: "Your journal entry has been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to save entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (sessionError) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Could not load entry</h2>
          <p className="text-muted-foreground mb-6">
            {sessionError instanceof Error ? sessionError.message : "Unknown error"}
          </p>
          <Link href="/history">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to History
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const startEditing = () => {
    if (!session) return;

    setEditData({
      courseName: session.courseName || "",
      practiceType: session.practiceType || "",
      date: session.date ? new Date(session.date).toISOString().split("T")[0] : "",
      score: session.score ?? null,
      duration: session.duration ?? null,
      journalMode: session.journalMode || "",
      overallMood: session.overallMood || 5,
      overallFocus: session.overallFocus || 5,
      freeWriting: session.freeWriting || "",
      preRoundMindset: session.preRoundMindset || "",
      preRoundMentalState: session.preRoundMentalState || "",
      preRoundGoals: session.preRoundGoals || "",
      preRoundRoutine: session.preRoundRoutine || "",
      focusQuality: session.focusQuality || "",
      thoughtProcess: session.thoughtProcess || "",
      keyMoments: session.keyMoments || "",
      missPattern: session.missPattern || "",
      strokeGains: session.strokeGains || "",
      gameCosts: session.gameCosts || "",
      decisionsReflection: session.decisionsReflection || "",
      courseManagement: session.courseManagement || "",
      targetSelection: session.targetSelection || "",
      emotionalDecisions: session.emotionalDecisions || "",
      emotionalHighs: session.emotionalHighs || "",
      emotionalLows: session.emotionalLows || "",
      joyMoments: session.joyMoments || "",
      emotionalChallenges: session.emotionalChallenges || "",
      adversityResponse: session.adversityResponse || "",
      routineCommitment: session.routineCommitment || "",
      lessonsLearned: session.lessonsLearned || "",
      gratitude: session.gratitude || "",
      nextSessionGoals: session.nextSessionGoals || "",
      swingFocus: session.swingFocus || "",
      confidenceBefore: session.confidenceBefore || 5,
      confidenceAfter: session.confidenceAfter || 5,
      selfRatings: (session.selfRatings as SelfRatings) || {},
      scorecardImage: session.scorecardImage || "",
    });

    setScorecardPreview(session.scorecardImage || null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditData({});
    setScorecardPreview(session?.scorecardImage || null);
  };

  const handleEdit = (field: string, value: any) => {
    setEditData((previous) => ({ ...previous, [field]: value }));
  };

  const handleRatingChange = (category: ThoughtCategory, value: number) => {
    setEditData((previous) => ({
      ...previous,
      selfRatings: {
        ...(previous.selfRatings || {}),
        [category]: value,
      },
    }));
  };

  const handleSave = () => {
    updateMutation.mutate(editData);
  };

  const removeScorecardPhoto = () => {
    handleEdit("scorecardImage", "");
    setScorecardPreview(null);
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-32 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card className="p-12 text-center">
          <h2 className="text-xl font-semibold mb-2">Entry Not Found</h2>
          <p className="text-muted-foreground mb-6">
            This journal entry doesn&apos;t exist or has been deleted.
          </p>
          <Link href="/history">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to History
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const isPlay = session.type === "play";
  const isFreeWrite = session.journalMode === "freeform";
  const selfRatings = editing
    ? ((editData.selfRatings as SelfRatings) || {})
    : ((session.selfRatings as SelfRatings) || {});
  const displayScorecardImage = editing ? scorecardPreview : session.scorecardImage;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link href="/history">
          <Button variant="ghost" size="sm" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={cancelEditing}
                data-testid="button-cancel-edit"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>

              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateMutation.isPending}
                data-testid="button-save-edit"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={startEditing}
                data-testid="button-edit"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    data-testid="button-delete"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>

                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Journal Entry?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete this journal
                      entry and all associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMutation.mutate()}
                      className="bg-destructive text-destructive-foreground"
                      data-testid="button-confirm-delete"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-lg flex items-center justify-center ${
                  isPlay ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"
                }`}
              >
                {isPlay ? (
                  <GolfFlagIcon className="w-7 h-7" />
                ) : (
                  <DrivingRangeIcon className="w-7 h-7" />
                )}
              </div>

              <div>
                {editing ? (
                  <div className="space-y-2">
                    {isPlay ? (
                      <Input
                        value={editData.courseName || ""}
                        onChange={(event) => handleEdit("courseName", event.target.value)}
                        placeholder="Course name"
                        className="text-lg font-semibold"
                        data-testid="edit-input-course"
                      />
                    ) : (
                      <Input
                        value={editData.practiceType || ""}
                        onChange={(event) => handleEdit("practiceType", event.target.value)}
                        placeholder="Practice type"
                        className="text-lg font-semibold"
                        data-testid="edit-input-practice-type"
                      />
                    )}

                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={editData.date || ""}
                        onChange={(event) => handleEdit("date", event.target.value)}
                        className="w-auto"
                        data-testid="edit-input-date"
                      />

                      {!isPlay && (
                        <Input
                          type="number"
                          value={editData.duration || ""}
                          onChange={(event) =>
                            handleEdit(
                              "duration",
                              event.target.value === ""
                                ? null
                                : parseInt(event.target.value, 10)
                            )
                          }
                          placeholder="Minutes"
                          className="w-24"
                          data-testid="edit-input-duration"
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <CardTitle className="text-2xl" data-testid="text-session-title">
                      {isPlay ? session.courseName || "Round" : session.practiceType || "Practice"}
                    </CardTitle>

                    <div className="flex items-center gap-4 text-muted-foreground mt-1 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(session.date), "EEEE, MMMM d, yyyy")}</span>
                      </div>

                      {session.duration ? (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>{session.duration} min</span>
                        </div>
                      ) : null}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Badge variant={isPlay ? "default" : "secondary"} className="text-sm">
                {isPlay ? "Round" : "Practice"}
              </Badge>

              {session.journalMode && !editing ? (
                <Badge variant="outline" className="text-xs" data-testid="badge-journal-mode">
                  {isFreeWrite ? (
                    <PenLine className="w-3 h-3 mr-1" />
                  ) : (
                    <BookOpen className="w-3 h-3 mr-1" />
                  )}
                  {isFreeWrite ? "Free Write" : "Guided"}
                </Badge>
              ) : null}

              {isPlay && editing ? (
                <Input
                  type="number"
                  value={editData.score || ""}
                  onChange={(event) =>
                    handleEdit(
                      "score",
                      event.target.value === "" ? null : parseInt(event.target.value, 10)
                    )
                  }
                  placeholder="Score"
                  className="w-20 text-right text-lg font-bold"
                  data-testid="edit-input-score"
                />
              ) : isPlay && session.score ? (
                <span className="text-2xl font-bold" data-testid="text-score">
                  {session.score}
                </span>
              ) : null}
            </div>
          </div>

          {editing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <Label>Mood: {editData.overallMood || 5}/10</Label>
                <Slider
                  min={1}
                  max={10}
                  step={1}
                  value={[editData.overallMood || 5]}
                  onValueChange={([value]) => handleEdit("overallMood", value)}
                  data-testid="edit-slider-mood"
                />
              </div>

              <div className="space-y-2">
                <Label>Focus: {editData.overallFocus || 5}/10</Label>
                <Slider
                  min={1}
                  max={10}
                  step={1}
                  value={[editData.overallFocus || 5]}
                  onValueChange={([value]) => handleEdit("overallFocus", value)}
                  data-testid="edit-slider-focus"
                />
              </div>
            </div>
          ) : (
            <div className="flex gap-6 pt-2 flex-wrap">
              {session.overallMood ? (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                    <Smile className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Mood</div>
                    <div className="font-semibold" data-testid="text-mood">
                      {session.overallMood}/10
                    </div>
                  </div>
                </div>
              ) : null}

              {session.overallFocus ? (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                    <Focus className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Focus</div>
                    <div className="font-semibold" data-testid="text-focus">
                      {session.overallFocus}/10
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-8">
          {(isFreeWrite || editing) && (
            <JournalSection
              title="Free Writing"
              content={editing ? editData.freeWriting : session.freeWriting}
              testId="section-free-writing"
              editing={editing}
              field="freeWriting"
              editData={editData}
              onEdit={handleEdit}
            />
          )}

          <JournalSection
            title={isPlay ? "Pre-Round Mindset" : "Session Goals"}
            content={editing ? editData.preRoundMindset : session.preRoundMindset}
            testId="section-pre-round-mindset"
            editing={editing}
            field="preRoundMindset"
            editData={editData}
            onEdit={handleEdit}
          />

          <JournalSection
            title="Pre-Round Mental State"
            content={editing ? editData.preRoundMentalState : session.preRoundMentalState}
            testId="section-pre-round-mental-state"
            editing={editing}
            field="preRoundMentalState"
            editData={editData}
            onEdit={handleEdit}
          />

          <JournalSection
            title="Pre-Round Goals"
            content={editing ? editData.preRoundGoals : session.preRoundGoals}
            testId="section-pre-round-goals"
            editing={editing}
            field="preRoundGoals"
            editData={editData}
            onEdit={handleEdit}
          />

          {(isPlay || editing) && (
            <JournalSection
              title="Pre-Round Routine"
              content={editing ? editData.preRoundRoutine : session.preRoundRoutine}
              testId="section-pre-round-routine"
              editing={editing}
              field="preRoundRoutine"
              editData={editData}
              onEdit={handleEdit}
            />
          )}

          {(!isPlay || editing) && (
            <div className="space-y-4" data-testid="section-swing-focus">
              <JournalSection
                title="Swing Work"
                content={editing ? editData.swingFocus : session.swingFocus}
                testId="section-swing-focus-text"
                editing={editing}
                field="swingFocus"
                editData={editData}
                onEdit={handleEdit}
              />

              {editing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Confidence Before: {editData.confidenceBefore || 5}/10</Label>
                    <Slider
                      min={1}
                      max={10}
                      step={1}
                      value={[editData.confidenceBefore || 5]}
                      onValueChange={([value]) => handleEdit("confidenceBefore", value)}
                      data-testid="edit-slider-confidence-before"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Confidence After: {editData.confidenceAfter || 5}/10</Label>
                    <Slider
                      min={1}
                      max={10}
                      step={1}
                      value={[editData.confidenceAfter || 5]}
                      onValueChange={([value]) => handleEdit("confidenceAfter", value)}
                      data-testid="edit-slider-confidence-after"
                    />
                  </div>
                </div>
              ) : session.confidenceBefore || session.confidenceAfter ? (
                <div className="flex gap-6 pt-2 flex-wrap">
                  {session.confidenceBefore ? (
                    <div className="flex items-center gap-2 bg-accent/50 rounded-md px-3 py-2">
                      <div className="text-sm text-muted-foreground">Before:</div>
                      <div className="font-semibold">{session.confidenceBefore}/10</div>
                    </div>
                  ) : null}

                  {session.confidenceAfter ? (
                    <div className="flex items-center gap-2 bg-accent/50 rounded-md px-3 py-2">
                      <div className="text-sm text-muted-foreground">After:</div>
                      <div className="font-semibold">{session.confidenceAfter}/10</div>
                    </div>
                  ) : null}

                  {session.confidenceBefore && session.confidenceAfter ? (
                    <div
                      className={`flex items-center gap-2 rounded-md px-3 py-2 ${
                        session.confidenceAfter > session.confidenceBefore
                          ? "bg-primary/10 text-primary"
                          : session.confidenceAfter < session.confidenceBefore
                            ? "bg-destructive/10 text-destructive"
                            : "bg-accent/50"
                      }`}
                    >
                      <div className="text-sm">
                        {session.confidenceAfter > session.confidenceBefore
                          ? `+${session.confidenceAfter - session.confidenceBefore} improvement`
                          : session.confidenceAfter < session.confidenceBefore
                            ? `${session.confidenceAfter - session.confidenceBefore} drop`
                            : "No change"}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}

          <JournalSection
            title="Focus & Presence"
            content={editing ? editData.focusQuality : session.focusQuality}
            testId="section-focus-quality"
            editing={editing}
            field="focusQuality"
            editData={editData}
            onEdit={handleEdit}
          />

          <JournalSection
            title="Thought Process"
            content={editing ? editData.thoughtProcess : session.thoughtProcess}
            testId="section-thought-process"
            editing={editing}
            field="thoughtProcess"
            editData={editData}
            onEdit={handleEdit}
          />

          <JournalSection
            title="Key Moments"
            content={editing ? editData.keyMoments : session.keyMoments}
            testId="section-key-moments"
            editing={editing}
            field="keyMoments"
            editData={editData}
            onEdit={handleEdit}
          />

          <JournalSection
            title="Miss Patterns"
            content={editing ? editData.missPattern : session.missPattern}
            testId="section-miss-pattern"
            editing={editing}
            field="missPattern"
            editData={editData}
            onEdit={handleEdit}
          />

          <JournalSection
            title="Stroke Gains"
            content={editing ? editData.strokeGains : session.strokeGains}
            testId="section-stroke-gains"
            editing={editing}
            field="strokeGains"
            editData={editData}
            onEdit={handleEdit}
          />

          <JournalSection
            title="Game Costs"
            content={editing ? editData.gameCosts : session.gameCosts}
            testId="section-game-costs"
            editing={editing}
            field="gameCosts"
            editData={editData}
            onEdit={handleEdit}
          />

          <JournalSection
            title={isPlay ? "Decision Making" : "Quality & Presence"}
            content={editing ? editData.decisionsReflection : session.decisionsReflection}
            testId="section-decisions-reflection"
            editing={editing}
            field="decisionsReflection"
            editData={editData}
            onEdit={handleEdit}
          />

          <JournalSection
            title="Course Management"
            content={editing ? editData.courseManagement : session.courseManagement}
            testId="section-course-management"
            editing={editing}
            field="courseManagement"
            editData={editData}
            onEdit={handleEdit}
          />

          <JournalSection
            title="Target Selection"
            content={editing ? editData.targetSelection : session.targetSelection}
            testId="section-target-selection"
            editing={editing}
            field="targetSelection"
            editData={editData}
            onEdit={handleEdit}
          />

          <JournalSection
            title="Emotional Decisions"
            content={editing ? editData.emotionalDecisions : session.emotionalDecisions}
            testId="section-emotional-decisions"
            editing={editing}
            field="emotionalDecisions"
            editData={editData}
            onEdit={handleEdit}
          />

          <JournalSection
            title="Emotional Highs"
            content={editing ? editData.emotionalHighs : session.emotionalHighs}
            testId="section-emotional-highs"
            editing={editing}
            field="emotionalHighs"
            editData={editData}
            onEdit={handleEdit}
          />

          <JournalSection
            title="Emotional Lows"
            content={editing ? editData.emotionalLows : session.emotionalLows}
            testId="section-emotional-lows"
            editing={editing}
            field="emotionalLows"
            editData={editData}
            onEdit={handleEdit}
          />

          <JournalSection
            title="Joy Moments"
            content={editing ? editData.joyMoments : session.joyMoments}
            testId="section-joy-moments"
            editing={editing}
            field="joyMoments"
            editData={editData}
            onEdit={handleEdit}
          />

          <JournalSection
            title="Emotional Challenges"
            content={editing ? editData.emotionalChallenges : session.emotionalChallenges}
            testId="section-emotional-challenges"
            editing={editing}
            field="emotionalChallenges"
            editData={editData}
            onEdit={handleEdit}
          />

          <JournalSection
            title="Adversity Response"
            content={editing ? editData.adversityResponse : session.adversityResponse}
            testId="section-adversity-response"
            editing={editing}
            field="adversityResponse"
            editData={editData}
            onEdit={handleEdit}
          />

          <JournalSection
            title="Routine Commitment"
            content={editing ? editData.routineCommitment : session.routineCommitment}
            testId="section-routine-commitment"
            editing={editing}
            field="routineCommitment"
            editData={editData}
            onEdit={handleEdit}
          />

          <JournalSection
            title={isPlay ? "Lessons Learned" : "What Worked"}
            content={editing ? editData.lessonsLearned : session.lessonsLearned}
            testId="section-lessons-learned"
            editing={editing}
            field="lessonsLearned"
            editData={editData}
            onEdit={handleEdit}
          />

          <JournalSection
            title="Gratitude"
            content={editing ? editData.gratitude : session.gratitude}
            testId="section-gratitude"
            editing={editing}
            field="gratitude"
            editData={editData}
            onEdit={handleEdit}
          />

          <JournalSection
            title="Next Session Goals"
            content={editing ? editData.nextSessionGoals : session.nextSessionGoals}
            testId="section-next-goals"
            editing={editing}
            field="nextSessionGoals"
            editData={editData}
            onEdit={handleEdit}
          />

          <SelfRatingsSection
            ratings={selfRatings}
            editing={editing}
            onRatingChange={handleRatingChange}
          />

          <EmbrReviewSection session={session} />

          <div className="space-y-3" data-testid="section-scorecard">
            {editing ? (
              <>
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Scorecard Photo URL
                </h3>

                <Input
                  value={editData.scorecardImage || ""}
                  onChange={(event) => {
                    handleEdit("scorecardImage", event.target.value);
                    setScorecardPreview(event.target.value || null);
                  }}
                  placeholder="Paste image URL"
                  data-testid="edit-input-scorecard-image"
                />

                {scorecardPreview ? (
                  <div className="relative inline-block">
                    <img
                      src={scorecardPreview}
                      alt="Scorecard preview"
                      className="rounded-lg border max-h-48 object-contain"
                      data-testid="img-scorecard-preview"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={removeScorecardPhoto}
                      data-testid="button-remove-scorecard"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : null}
              </>
            ) : displayScorecardImage ? (
              <>
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Scorecard Photo
                </h3>
                <a href={displayScorecardImage} target="_blank" rel="noopener noreferrer">
                  <img
                    src={displayScorecardImage}
                    alt="Scorecard"
                    className="rounded-lg border max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                    data-testid="img-scorecard"
                  />
                </a>
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
