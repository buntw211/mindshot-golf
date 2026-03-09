import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Flag,
  Target,
  Lightbulb,
  ArrowRight,
  HelpCircle,
  Sliders,
  BarChart3,
  Calendar,
} from "lucide-react";
import type { PatternSummary, ThoughtCategory, RatingDataPoint } from "@shared/schema";
import { format, subDays } from "date-fns";
import mindshotLogo from "@assets/mindshot_logo.png";

type DatePreset = "all" | "7d" | "30d" | "90d" | "custom";

const categoryDescriptions: Record<ThoughtCategory, string> = {
  "confidence": "Your belief in your ability to execute shots and make decisions",
  "focus": "Your ability to stay present and concentrate on the task at hand",
  "frustration": "How you handle disappointment and unexpected outcomes",
  "anxiety": "Nervous energy and worry about performance or results",
  "patience": "Your ability to accept the pace of improvement and stay calm",
  "decision-making": "How you choose shots, targets, and strategy",
  "self-talk": "The internal dialogue that influences your mental state",
  "pressure": "How you perform when the stakes feel high",
  "expectations": "How your anticipations affect your experience and performance",
  "acceptance": "Your ability to let go and move forward from any result",
};

const categoryTips: Record<ThoughtCategory, string> = {
  "confidence": "Build confidence through preparation and focusing on process over outcome.",
  "focus": "Use a consistent pre-shot routine to anchor your attention.",
  "frustration": "Practice accepting every shot as information, not judgement.",
  "anxiety": "Deep breathing and positive visualization can calm pre-shot nerves.",
  "patience": "Embrace the journey - improvement happens one shot at a time.",
  "decision-making": "Trust your instincts and commit fully to each decision.",
  "self-talk": "Speak to yourself like you would to a trusted teammate.",
  "pressure": "Treat every shot the same - same routine, same commitment.",
  "expectations": "Release expectations and focus on being present with each shot.",
  "acceptance": "What happened has already happened. Your only job now is the next shot.",
};

function RatingBar({ rating }: { rating: number }) {
  const percentage = (rating / 10) * 100;
  const color = rating >= 7 ? "bg-green-500" : rating >= 4 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${percentage}%` }} />
    </div>
  );
}

function RatingHistory({ history }: { history: RatingDataPoint[] }) {
  const maxVisible = 12;
  const visible = history.slice(-maxVisible);
  const barWidth = Math.max(100 / maxVisible, 100 / visible.length);

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-[3px] h-16">
        {visible.map((dp, i) => {
          const heightPct = (dp.rating / 10) * 100;
          const color = dp.rating >= 7
            ? "bg-green-500 dark:bg-green-400"
            : dp.rating >= 4
            ? "bg-amber-500 dark:bg-amber-400"
            : "bg-red-500 dark:bg-red-400";
          return (
            <div
              key={`${dp.date}-${i}`}
              className="group relative flex-1 flex flex-col justify-end"
              style={{ maxWidth: `${barWidth}%` }}
            >
              <div
                className={`rounded-sm ${color} min-w-[6px] transition-all hover:opacity-80`}
                style={{ height: `${heightPct}%` }}
              />
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                <div className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md whitespace-nowrap border">
                  <div className="font-medium">{dp.rating}/10</div>
                  <div className="text-muted-foreground">{format(new Date(dp.date), "MMM d")}</div>
                  <div className="text-muted-foreground capitalize">{dp.sessionType}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        {visible.length > 0 && (
          <>
            <span>{format(new Date(visible[0].date), "MMM d")}</span>
            {visible.length > 1 && (
              <span>{format(new Date(visible[visible.length - 1].date), "MMM d")}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PatternCard({ pattern }: { pattern: PatternSummary }) {
  const TrendIcon = pattern.trend === "improving" ? TrendingUp : pattern.trend === "declining" ? TrendingDown : Minus;
  const trendColor = pattern.trend === "improving" 
    ? "text-green-600 dark:text-green-400" 
    : pattern.trend === "declining" 
    ? "text-red-500 dark:text-red-400" 
    : "text-muted-foreground";
  const trendLabel = pattern.trend === "improving" ? "Improving" : pattern.trend === "declining" ? "Needs attention" : "Stable";
  const ratingColor = pattern.averageRating >= 7 ? "text-green-600 dark:text-green-400" : pattern.averageRating >= 4 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400";
  
  return (
    <Card className="hover-elevate" data-testid={`card-pattern-${pattern.category}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="capitalize">{pattern.category.replace("-", " ")}</CardTitle>
            <CardDescription className="mt-1">
              {categoryDescriptions[pattern.category]}
            </CardDescription>
          </div>
          <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
            <TrendIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{trendLabel}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold ${ratingColor}`} data-testid={`text-rating-${pattern.category}`}>
            {pattern.averageRating.toFixed(1)}
          </span>
          <span className="text-muted-foreground text-sm">/ 10 avg</span>
          <span className="text-xs text-muted-foreground ml-auto">
            {pattern.sessionCount} {pattern.sessionCount === 1 ? "session" : "sessions"}
          </span>
        </div>

        <RatingBar rating={pattern.averageRating} />

        {pattern.ratingHistory.length > 1 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Rating over time</p>
            <RatingHistory history={pattern.ratingHistory} />
          </div>
        )}

        <div className="p-3 bg-accent/50 rounded-md">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-sm">{categoryTips[pattern.category]}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DateRangeFilter({
  preset,
  onPresetChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
}: {
  preset: DatePreset;
  onPresetChange: (p: DatePreset) => void;
  customStart: string;
  customEnd: string;
  onCustomStartChange: (v: string) => void;
  onCustomEndChange: (v: string) => void;
}) {
  const presets: { value: DatePreset; label: string }[] = [
    { value: "all", label: "All Time" },
    { value: "7d", label: "Last 7 Days" },
    { value: "30d", label: "Last 30 Days" },
    { value: "90d", label: "Last 90 Days" },
    { value: "custom", label: "Custom" },
  ];

  return (
    <Card data-testid="card-date-filter">
      <CardContent className="py-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Time Period:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <Button
                key={p.value}
                variant={preset === p.value ? "default" : "outline"}
                size="sm"
                onClick={() => onPresetChange(p.value)}
                data-testid={`button-preset-${p.value}`}
              >
                {p.label}
              </Button>
            ))}
          </div>
          {preset === "custom" && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="start-date" className="text-xs text-muted-foreground">From</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={customStart}
                  onChange={(e) => onCustomStartChange(e.target.value)}
                  className="h-8 w-auto text-sm"
                  data-testid="input-start-date"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Label htmlFor="end-date" className="text-xs text-muted-foreground">To</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={customEnd}
                  onChange={(e) => onCustomEndChange(e.target.value)}
                  className="h-8 w-auto text-sm"
                  data-testid="input-end-date"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Patterns() {
  const [preset, setPreset] = useState<DatePreset>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const { startDate, endDate } = useMemo(() => {
    if (preset === "all") return { startDate: undefined, endDate: undefined };
    if (preset === "custom") {
      let s = customStart || undefined;
      let e = customEnd || undefined;
      if (s && e && s > e) {
        [s, e] = [e, s];
      }
      return { startDate: s, endDate: e };
    }
    const days = preset === "7d" ? 6 : preset === "30d" ? 29 : 89;
    return {
      startDate: format(subDays(new Date(), days), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
    };
  }, [preset, customStart, customEnd]);

  const queryParams = new URLSearchParams();
  if (startDate) queryParams.set("startDate", startDate);
  if (endDate) queryParams.set("endDate", endDate);
  const queryString = queryParams.toString();
  const apiUrl = `/api/patterns${queryString ? `?${queryString}` : ""}`;

  const { data: patterns, isLoading } = useQuery<PatternSummary[]>({
    queryKey: ["/api/patterns", startDate, endDate],
    queryFn: async () => {
      const res = await fetch(apiUrl, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch patterns");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="w-12 h-12 rounded-lg" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const hasPatterns = patterns && patterns.length > 0;
  const strongAreas = patterns?.filter(p => p.averageRating >= 7) || [];
  const needsAttention = patterns?.filter(p => p.averageRating < 5) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
            <img src={mindshotLogo} alt="MindShot" className="w-9 h-9 object-contain" data-testid="img-patterns-logo" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-patterns-title">Thought Patterns</h1>
            <p className="text-muted-foreground">
              Track your mental game ratings over time
            </p>
          </div>
        </div>
        <Link href="/tips">
          <Button variant="outline" data-testid="button-view-tips">
            <Lightbulb className="w-4 h-4 mr-2" />
            View Tips Library
          </Button>
        </Link>
      </div>

      <DateRangeFilter
        preset={preset}
        onPresetChange={setPreset}
        customStart={customStart}
        customEnd={customEnd}
        onCustomStartChange={setCustomStart}
        onCustomEndChange={setCustomEnd}
      />

      <Card className="bg-accent/30 border-accent" data-testid="card-how-it-works">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">How Thought Patterns Work</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Sliders className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Self-Assessment Ratings</h4>
                <p className="text-xs text-muted-foreground">
                  After each session, you rate yourself 1-10 across 10 mental game categories. These ratings form the basis of your pattern tracking.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Average Over Time</h4>
                <p className="text-xs text-muted-foreground">
                  We calculate your average rating for each category and track how it changes across sessions so you can see trends.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Trend Detection</h4>
                <p className="text-xs text-muted-foreground">
                  By comparing recent sessions to older ones, we identify which areas are improving and which need more attention.
                </p>
              </div>
            </div>
          </div>
          <div className="p-3 bg-card rounded-md border">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Why this matters:</span> Tracking your mental game with consistent 1-10 ratings reveals patterns you might not notice in the moment. Over time, you'll see which areas are growing and where to focus your mental training.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-scale-explanation">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Understanding the Rating Scales</CardTitle>
          </div>
          <CardDescription>
            Each self-assessment category uses a 1-10 scale. Here's what the numbers mean:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="font-semibold text-red-700 dark:text-red-400 mb-1">1-3: Struggling</div>
              <p className="text-xs text-muted-foreground">
                This area was a significant challenge. You noticed it affecting your game negatively.
              </p>
            </div>
            <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <div className="font-semibold text-amber-700 dark:text-amber-400 mb-1">4-6: Moderate</div>
              <p className="text-xs text-muted-foreground">
                Average performance. Some good moments, some room for improvement.
              </p>
            </div>
            <div className="p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="font-semibold text-green-700 dark:text-green-400 mb-1">7-10: Strong</div>
              <p className="text-xs text-muted-foreground">
                This area was a strength. You felt solid and it helped your performance.
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Category Scale Meanings</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-muted/50">
                <span className="font-medium">Confidence:</span>
                <span className="text-muted-foreground"> 1 = Doubting every shot → 10 = Total belief in yourself</span>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <span className="font-medium">Focus:</span>
                <span className="text-muted-foreground"> 1 = Mind wandering → 10 = Completely locked in</span>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <span className="font-medium">Frustration:</span>
                <span className="text-muted-foreground"> 1 = Easily upset → 10 = Calm through mistakes</span>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <span className="font-medium">Anxiety:</span>
                <span className="text-muted-foreground"> 1 = Very nervous → 10 = Completely relaxed</span>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <span className="font-medium">Patience:</span>
                <span className="text-muted-foreground"> 1 = Rushing/impatient → 10 = Accepting the process</span>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <span className="font-medium">Decision Making:</span>
                <span className="text-muted-foreground"> 1 = Uncertain/second-guessing → 10 = Decisive and committed</span>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <span className="font-medium">Self-Talk:</span>
                <span className="text-muted-foreground"> 1 = Critical inner voice → 10 = Supportive inner coach</span>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <span className="font-medium">Pressure:</span>
                <span className="text-muted-foreground"> 1 = Struggled under pressure → 10 = Thrived when it mattered</span>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <span className="font-medium">Expectations:</span>
                <span className="text-muted-foreground"> 1 = Unrealistic demands → 10 = Balanced and fair to yourself</span>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <span className="font-medium">Acceptance:</span>
                <span className="text-muted-foreground"> 1 = Fighting results → 10 = Letting go and moving forward</span>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-accent/50 rounded-md">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm">
                <span className="font-medium">Tip:</span> Rate yourself honestly based on how you actually felt during the session, not how you wish you'd performed. Honest self-assessment is the foundation of real improvement.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {!hasPatterns ? (
        <Card className="p-12">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 overflow-hidden">
              <img src={mindshotLogo} alt="MindShot" className="w-12 h-12 object-contain opacity-50" data-testid="img-patterns-empty-logo" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No Patterns Yet</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Start journaling your rounds and practice sessions with self-assessment ratings
              to track your mental game patterns over time.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/play">
                <Button data-testid="button-log-round">
                  <Flag className="w-4 h-4 mr-2" />
                  Log a Round
                </Button>
              </Link>
              <Link href="/practice">
                <Button variant="outline" data-testid="button-log-practice">
                  <Target className="w-4 h-4 mr-2" />
                  Log Practice
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {(strongAreas.length > 0 || needsAttention.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {strongAreas.length > 0 && (
                <Card className="bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                      <TrendingUp className="w-5 h-5" />
                      <span className="font-semibold">Strong Areas (7+)</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {strongAreas.map(p => (
                        <Badge key={p.category} variant="outline" className="capitalize bg-white dark:bg-card">
                          {p.category.replace("-", " ")} — {p.averageRating.toFixed(1)}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {needsAttention.length > 0 && (
                <Card className="bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-2">
                      <TrendingDown className="w-5 h-5" />
                      <span className="font-semibold">Needs Attention (below 5)</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {needsAttention.map(p => (
                        <Badge key={p.category} variant="outline" className="capitalize bg-white dark:bg-card">
                          {p.category.replace("-", " ")} — {p.averageRating.toFixed(1)}
                        </Badge>
                      ))}
                    </div>
                    <Link href="/tips" className="inline-flex items-center gap-1 text-sm text-red-700 dark:text-red-400 mt-2">
                      Get reframing tips <ArrowRight className="w-3 h-3" />
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {patterns
              .sort((a, b) => b.sessionCount - a.sessionCount)
              .map((pattern) => (
                <PatternCard key={pattern.category} pattern={pattern} />
              ))}
          </div>
        </>
      )}
    </div>
  );
}
