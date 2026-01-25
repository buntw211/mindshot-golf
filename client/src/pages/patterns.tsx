import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  Flag,
  Target,
  Lightbulb,
  ArrowRight,
  HelpCircle,
  BookOpen,
  BarChart3,
  Sliders,
} from "lucide-react";
import type { PatternSummary, ThoughtCategory } from "@shared/schema";

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

function PatternCard({ pattern }: { pattern: PatternSummary }) {
  const TrendIcon = pattern.trend === "improving" ? TrendingUp : pattern.trend === "declining" ? TrendingDown : Minus;
  const trendColor = pattern.trend === "improving" 
    ? "text-green-600 dark:text-green-400" 
    : pattern.trend === "declining" 
    ? "text-red-500 dark:text-red-400" 
    : "text-muted-foreground";
  const trendLabel = pattern.trend === "improving" ? "Improving" : pattern.trend === "declining" ? "Needs attention" : "Stable";
  
  const positivePercentage = pattern.count > 0 ? (pattern.positiveCount / pattern.count) * 100 : 0;
  
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
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Thought balance</span>
            <span>{Math.round(positivePercentage)}% positive</span>
          </div>
          <Progress value={positivePercentage} className="h-2" />
        </div>
        
        <div className="flex gap-3">
          <div className="flex-1 p-3 rounded-md bg-green-50 dark:bg-green-900/20 text-center">
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
              {pattern.positiveCount}
            </div>
            <div className="text-xs text-green-600 dark:text-green-500">Positive</div>
          </div>
          <div className="flex-1 p-3 rounded-md bg-muted text-center">
            <div className="text-2xl font-bold">{pattern.neutralCount}</div>
            <div className="text-xs text-muted-foreground">Neutral</div>
          </div>
          <div className="flex-1 p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-center">
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">
              {pattern.negativeCount}
            </div>
            <div className="text-xs text-red-600 dark:text-red-500">Negative</div>
          </div>
        </div>

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

export default function Patterns() {
  const { data: patterns, isLoading } = useQuery<PatternSummary[]>({
    queryKey: ["/api/patterns"],
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
  const improvingPatterns = patterns?.filter(p => p.trend === "improving") || [];
  const decliningPatterns = patterns?.filter(p => p.trend === "declining") || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-patterns-title">Thought Patterns</h1>
            <p className="text-muted-foreground">
              Recognize and understand your mental tendencies
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
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Journal Analysis</h4>
                <p className="text-xs text-muted-foreground">
                  We analyze the words and phrases in your journal entries to detect patterns in how you think about your game.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Pattern Detection</h4>
                <p className="text-xs text-muted-foreground">
                  Your writing reveals mental tendencies you may not notice. We track positive, neutral, and negative thoughts across 10 categories.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Sliders className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Self-Assessment Comparison</h4>
                <p className="text-xs text-muted-foreground">
                  Compare the self-ratings you give in journals against what your writing reveals. Gaps between them highlight blind spots.
                </p>
              </div>
            </div>
          </div>
          <div className="p-3 bg-card rounded-md border">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Why this matters:</span> Often we feel differently about our mental game than what actually shows up in our thoughts. 
              For example, you might rate your patience as "8/10" but your journal entries reveal frequent frustration. 
              This comparison helps build self-awareness and guides where to focus your mental game work.
            </p>
          </div>
        </CardContent>
      </Card>

      {!hasPatterns ? (
        <Card className="p-12">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No Patterns Yet</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Start journaling your rounds and practice sessions to identify 
              recurring thought patterns in your mental game.
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
          {(improvingPatterns.length > 0 || decliningPatterns.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {improvingPatterns.length > 0 && (
                <Card className="bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                      <TrendingUp className="w-5 h-5" />
                      <span className="font-semibold">Improving Areas</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {improvingPatterns.map(p => (
                        <Badge key={p.category} variant="outline" className="capitalize bg-white dark:bg-card">
                          {p.category.replace("-", " ")}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {decliningPatterns.length > 0 && (
                <Card className="bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-2">
                      <TrendingDown className="w-5 h-5" />
                      <span className="font-semibold">Needs Attention</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {decliningPatterns.map(p => (
                        <Badge key={p.category} variant="outline" className="capitalize bg-white dark:bg-card">
                          {p.category.replace("-", " ")}
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
              .sort((a, b) => b.count - a.count)
              .map((pattern) => (
                <PatternCard key={pattern.category} pattern={pattern} />
              ))}
          </div>
        </>
      )}
    </div>
  );
}
