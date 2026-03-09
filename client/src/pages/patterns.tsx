import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Lightbulb,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Sliders,
  BarChart3,
} from "lucide-react";
import { GolfFlagIcon } from "@/components/golf-flag-icon";
import type { PatternSummary, ThoughtCategory, RatingDataPoint } from "@shared/schema";
import { format, subDays } from "date-fns";
import mindshotLogo from "@assets/mindshot_logo.png";

type DatePreset = "all" | "7d" | "30d" | "90d" | "custom";

const categoryDescriptions: Record<ThoughtCategory, string> = {
  "confidence": "Belief in your ability to execute",
  "focus": "Staying present and concentrated",
  "frustration": "Handling disappointment",
  "anxiety": "Managing nervous energy",
  "patience": "Accepting the pace of the game",
  "decision-making": "Shot and strategy selection",
  "self-talk": "Quality of internal dialogue",
  "pressure": "Performing when stakes are high",
  "expectations": "Managing anticipations",
  "acceptance": "Letting go and moving forward",
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

function RatingHistory({ history }: { history: RatingDataPoint[] }) {
  const maxVisible = 12;
  const visible = history.slice(-maxVisible);

  return (
    <div className="space-y-1">
      <div className="flex items-end gap-[2px] h-10">
        {visible.map((dp, i) => {
          const heightPct = (dp.rating / 10) * 100;
          const color = dp.rating >= 7
            ? "bg-green-500/80 dark:bg-green-400/80"
            : dp.rating >= 4
            ? "bg-amber-500/80 dark:bg-amber-400/80"
            : "bg-red-500/80 dark:bg-red-400/80";
          return (
            <div
              key={`${dp.date}-${i}`}
              className="group relative flex-1 flex flex-col justify-end"
            >
              <div
                className={`rounded-[2px] ${color} min-w-[4px] transition-all hover:opacity-100 opacity-70 hover:scale-x-110`}
                style={{ height: `${heightPct}%` }}
              />
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                <div className="bg-popover text-popover-foreground text-[10px] px-1.5 py-1 rounded shadow-md whitespace-nowrap border">
                  <span className="font-medium">{dp.rating}/10</span>
                  <span className="text-muted-foreground ml-1">{format(new Date(dp.date), "MMM d")}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {visible.length > 1 && (
        <div className="flex justify-between text-[9px] text-muted-foreground/60">
          <span>{format(new Date(visible[0].date), "MMM d")}</span>
          <span>{format(new Date(visible[visible.length - 1].date), "MMM d")}</span>
        </div>
      )}
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
  const barColor = pattern.averageRating >= 7 ? "bg-green-500" : pattern.averageRating >= 4 ? "bg-amber-500" : "bg-red-500";
  const barPct = (pattern.averageRating / 10) * 100;
  
  return (
    <Card className="hover-elevate" data-testid={`card-pattern-${pattern.category}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold capitalize text-sm">{pattern.category.replace("-", " ")}</h3>
            <p className="text-[11px] text-muted-foreground">{categoryDescriptions[pattern.category]}</p>
          </div>
          <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
            <TrendIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{trendLabel}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-2xl font-bold tabular-nums ${ratingColor}`} data-testid={`text-rating-${pattern.category}`}>
            {pattern.averageRating.toFixed(1)}
          </span>
          <div className="flex-1 space-y-1">
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${barPct}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground/60">
              <span>1</span>
              <span>{pattern.sessionCount} {pattern.sessionCount === 1 ? "session" : "sessions"}</span>
              <span>10</span>
            </div>
          </div>
        </div>

        {pattern.ratingHistory.length > 1 && (
          <RatingHistory history={pattern.ratingHistory} />
        )}

        <div className="p-2 bg-accent/40 rounded">
          <div className="flex items-start gap-1.5">
            <Lightbulb className="w-3 h-3 text-primary mt-0.5 shrink-0" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">{categoryTips[pattern.category]}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Patterns() {
  const [preset, setPreset] = useState<DatePreset>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showGuide, setShowGuide] = useState(false);

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
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div>
            <Skeleton className="h-7 w-40 mb-1" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-24 w-full" />
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

  const presets: { value: DatePreset; label: string }[] = [
    { value: "all", label: "All" },
    { value: "7d", label: "7d" },
    { value: "30d", label: "30d" },
    { value: "90d", label: "90d" },
    { value: "custom", label: "Custom" },
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
            <img src={mindshotLogo} alt="MindShot" className="w-8 h-8 object-contain" data-testid="img-patterns-logo" />
          </div>
          <div>
            <h1 className="text-xl font-bold" data-testid="text-patterns-title">Thought Patterns</h1>
            <p className="text-sm text-muted-foreground">
              Track your mental game ratings over time
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowGuide(!showGuide)}
            className="text-xs text-muted-foreground"
            data-testid="button-toggle-guide"
          >
            {showGuide ? <ChevronUp className="w-3.5 h-3.5 mr-1" /> : <ChevronDown className="w-3.5 h-3.5 mr-1" />}
            Guide
          </Button>
          <Link href="/tips">
            <Button variant="outline" size="sm" data-testid="button-view-tips">
              <Lightbulb className="w-3.5 h-3.5 mr-1" />
              Tips
            </Button>
          </Link>
        </div>
      </div>

      {showGuide && (
        <Card className="bg-accent/20 border-accent/40">
          <CardContent className="py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Sliders className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-0.5">Self-Assessment Ratings</h4>
                  <p className="text-xs text-muted-foreground">
                    After each session, you rate yourself 1-10 across 10 mental game categories. These ratings form the basis of your pattern tracking.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-0.5">Average Over Time</h4>
                  <p className="text-xs text-muted-foreground">
                    We calculate your average rating for each category and track how it changes across sessions so you can see trends.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-0.5">Trend Detection</h4>
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50">
                <div className="font-semibold text-red-700 dark:text-red-400 mb-0.5">1-3: Struggling</div>
                <p className="text-muted-foreground">This area was a significant challenge. You noticed it affecting your game negatively.</p>
              </div>
              <div className="p-2.5 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/50">
                <div className="font-semibold text-amber-700 dark:text-amber-400 mb-0.5">4-6: Moderate</div>
                <p className="text-muted-foreground">Average performance. Some good moments, some room for improvement.</p>
              </div>
              <div className="p-2.5 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200/50 dark:border-green-800/50">
                <div className="font-semibold text-green-700 dark:text-green-400 mb-0.5">7-10: Strong</div>
                <p className="text-muted-foreground">This area was a strength. You felt solid and it helped your performance.</p>
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
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-2" data-testid="card-date-filter">
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
          {presets.map((p) => (
            <button
              key={p.value}
              onClick={() => setPreset(p.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                preset === p.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`button-preset-${p.value}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === "custom" && (
          <div className="flex items-center gap-1.5 text-xs">
            <Input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="h-7 w-[130px] text-xs"
              data-testid="input-start-date"
            />
            <span className="text-muted-foreground">—</span>
            <Input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="h-7 w-[130px] text-xs"
              data-testid="input-end-date"
            />
          </div>
        )}
        {preset !== "all" && preset !== "custom" && (
          <span className="text-[11px] text-muted-foreground">
            {format(new Date(startDate!), "MMM d")} — {format(new Date(endDate!), "MMM d, yyyy")}
          </span>
        )}
      </div>

      {!hasPatterns ? (
        <Card className="p-10">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 overflow-hidden">
              <img src={mindshotLogo} alt="MindShot" className="w-10 h-10 object-contain opacity-50" data-testid="img-patterns-empty-logo" />
            </div>
            <h2 className="text-lg font-semibold mb-1">No Patterns Yet</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">
              {preset !== "all"
                ? "No sessions found in this time period. Try a different range or log a session."
                : "Start journaling with self-assessment ratings to track your mental game patterns."}
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              <Link href="/play">
                <Button size="sm" data-testid="button-log-round">
                  <GolfFlagIcon className="w-3.5 h-3.5" />
                  Log a Round
                </Button>
              </Link>
              <Link href="/practice">
                <Button variant="outline" size="sm" data-testid="button-log-practice">
                  <Target className="w-3.5 h-3.5 mr-1.5" />
                  Log Practice
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {(strongAreas.length > 0 || needsAttention.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {strongAreas.length > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50/60 dark:bg-green-900/10 border border-green-200/50 dark:border-green-800/30">
                  <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                  <div className="flex flex-wrap gap-1.5">
                    {strongAreas.map(p => (
                      <Badge key={p.category} variant="outline" className="capitalize text-[10px] py-0 bg-white dark:bg-card">
                        {p.category.replace("-", " ")} {p.averageRating.toFixed(1)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {needsAttention.length > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50/60 dark:bg-red-900/10 border border-red-200/50 dark:border-red-800/30">
                  <TrendingDown className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {needsAttention.map(p => (
                      <Badge key={p.category} variant="outline" className="capitalize text-[10px] py-0 bg-white dark:bg-card">
                        {p.category.replace("-", " ")} {p.averageRating.toFixed(1)}
                      </Badge>
                    ))}
                  </div>
                  <Link href="/tips">
                    <ArrowRight className="w-3.5 h-3.5 text-red-500 dark:text-red-400 shrink-0" />
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
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
