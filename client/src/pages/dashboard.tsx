import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Flag,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Smile,
  Focus,
  BarChart3,
  Crown,
} from "lucide-react";
import type { DashboardStats, Session } from "@shared/schema";
import { format } from "date-fns";
import mindshotLogo from "@assets/mindshot_logo.png";

interface SubscriptionInfo {
  subscriptionStatus: string;
  subscriptionTier: string | null;
  sessionCount: number;
  freeEntriesRemaining: number;
  isSubscribed: boolean;
}

function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function SessionCard({ session }: { session: Session }) {
  const isPlay = session.type === "play";
  
  return (
    <Link href={`/session/${session.id}`}>
      <Card className="hover-elevate cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-md flex items-center justify-center ${
                isPlay ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"
              }`}>
                {isPlay ? <Flag className="w-5 h-5" /> : <Target className="w-5 h-5" />}
              </div>
              <div>
                <div className="font-medium">
                  {isPlay ? (session.courseName || "Round") : (session.practiceType || "Practice")}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(session.date), "MMM d, yyyy")}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              {isPlay && session.score && (
                <Badge variant="secondary">{session.score}</Badge>
              )}
              {session.duration && (
                <span className="text-xs text-muted-foreground">{session.duration} min</span>
              )}
            </div>
          </div>
          {session.overallMood && session.overallFocus && (
            <div className="flex gap-4 mt-3 pt-3 border-t">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Smile className="w-3.5 h-3.5" />
                <span>Mood: {session.overallMood}/10</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Focus className="w-3.5 h-3.5" />
                <span>Focus: {session.overallFocus}/10</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function PatternCard({
  category,
  count,
  positiveCount,
  negativeCount,
  trend,
}: {
  category: string;
  count: number;
  positiveCount: number;
  negativeCount: number;
  trend: "improving" | "stable" | "declining";
}) {
  const TrendIcon = trend === "improving" ? TrendingUp : trend === "declining" ? TrendingDown : Minus;
  const trendColor = trend === "improving" ? "text-green-600" : trend === "declining" ? "text-red-500" : "text-muted-foreground";
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium capitalize">{category.replace("-", " ")}</span>
          <TrendIcon className={`w-4 h-4 ${trendColor}`} />
        </div>
        <div className="text-2xl font-bold mb-2">{count}</div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
            +{positiveCount}
          </Badge>
          <Badge variant="outline" className="text-xs bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
            -{negativeCount}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard"],
  });
  const { data: subInfo } = useQuery<SubscriptionInfo>({
    queryKey: ["/api/subscription"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const hasData = stats && stats.totalSessions > 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">Mental Game Dashboard</h1>
          <p className="text-muted-foreground">
            Track your thoughts, improve your game
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/play">
            <Button data-testid="button-new-round">
              <Flag className="w-4 h-4 mr-2" />
              New Round
            </Button>
          </Link>
          <Link href="/practice">
            <Button variant="outline" data-testid="button-new-practice">
              <Target className="w-4 h-4 mr-2" />
              New Practice
            </Button>
          </Link>
        </div>
      </div>

      {subInfo && !subInfo.isSubscribed && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium" data-testid="text-free-entries">
                    {subInfo.freeEntriesRemaining > 0
                      ? `${subInfo.freeEntriesRemaining} of 4 free entries remaining`
                      : "You've used all 4 free entries"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {subInfo.freeEntriesRemaining > 0
                      ? "Upgrade to Pro for unlimited journal entries"
                      : "Subscribe to continue journaling"}
                  </p>
                </div>
              </div>
              <Link href="/subscribe">
                <Button size="sm" data-testid="button-dashboard-upgrade">
                  <Crown className="w-4 h-4 mr-1" />
                  {subInfo.freeEntriesRemaining > 0 ? "Upgrade" : "Subscribe Now"}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {!hasData ? (
        <Card className="p-12">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 overflow-hidden">
              <img src={mindshotLogo} alt="MindShot" className="w-12 h-12 object-contain" data-testid="img-dashboard-logo" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Start Your Mental Game Journey</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Record your first round or practice session to begin tracking your thoughts,
              patterns, and mental progress on the course.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/play">
                <Button size="lg" data-testid="button-start-round">
                  <Flag className="w-4 h-4 mr-2" />
                  Log Your First Round
                </Button>
              </Link>
              <Link href="/practice">
                <Button size="lg" variant="outline" data-testid="button-start-practice">
                  <Target className="w-4 h-4 mr-2" />
                  Log Practice Session
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Sessions"
              value={stats.totalSessions}
              icon={BarChart3}
              subtitle={`${stats.playSessions} rounds, ${stats.practiceSessions} practice`}
            />
            <StatCard
              title="Play Rounds"
              value={stats.playSessions}
              icon={Flag}
            />
            <StatCard
              title="Practice Sessions"
              value={stats.practiceSessions}
              icon={Target}
            />
            <StatCard
              title="Avg. Focus"
              value={stats.avgFocus ? `${stats.avgFocus.toFixed(1)}/10` : "N/A"}
              icon={Focus}
              subtitle={stats.avgMood ? `Mood: ${stats.avgMood.toFixed(1)}/10` : undefined}
            />
          </div>

          {stats.topPatterns && stats.topPatterns.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Top Thought Patterns</h2>
                <Link href="/patterns">
                  <Button variant="ghost" size="sm" data-testid="link-view-all-patterns">
                    View All
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.topPatterns.slice(0, 3).map((pattern) => (
                  <PatternCard key={pattern.category} {...pattern} />
                ))}
              </div>
            </div>
          )}

          {stats.recentSessions && stats.recentSessions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Recent Sessions</h2>
                <Link href="/history">
                  <Button variant="ghost" size="sm" data-testid="link-view-all-sessions">
                    View All
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.recentSessions.slice(0, 4).map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
