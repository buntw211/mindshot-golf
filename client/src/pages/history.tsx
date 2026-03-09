import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Target,
  Calendar,
  Smile,
  Focus,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { GolfFlagIcon } from "@/components/golf-flag-icon";
import type { Session } from "@shared/schema";
import { format } from "date-fns";

function SessionCard({ session }: { session: Session }) {
  const isPlay = session.type === "play";
  
  return (
    <Link href={`/session/${session.id}`}>
      <Card className="hover-elevate cursor-pointer" data-testid={`card-session-${session.id}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-md flex items-center justify-center ${
                isPlay ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"
              }`}>
                {isPlay ? <GolfFlagIcon className="w-6 h-6" /> : <Target className="w-6 h-6" />}
              </div>
              <div>
                <div className="font-medium text-lg">
                  {isPlay ? (session.courseName || "Round") : (session.practiceType || "Practice")}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(session.date), "EEEE, MMMM d, yyyy")}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={isPlay ? "default" : "secondary"}>
                {isPlay ? "Round" : "Practice"}
              </Badge>
              {isPlay && session.score && (
                <span className="text-lg font-bold">{session.score}</span>
              )}
              {!isPlay && session.duration && (
                <span className="text-sm text-muted-foreground">{session.duration} min</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex gap-6">
              {session.overallMood && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Smile className="w-4 h-4" />
                  <span>Mood: {session.overallMood}/10</span>
                </div>
              )}
              {session.overallFocus && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Focus className="w-4 h-4" />
                  <span>Focus: {session.overallFocus}/10</span>
                </div>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function History() {
  const { data: sessions, isLoading } = useQuery<Session[]>({
    queryKey: ["/api/sessions"],
  });

  const playSessions = sessions?.filter((s) => s.type === "play") || [];
  const practiceSessions = sessions?.filter((s) => s.type === "practice") || [];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="w-12 h-12 rounded-lg" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
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

  const hasData = sessions && sessions.length > 0;

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-history-title">Journal History</h1>
          <p className="text-muted-foreground">
            {hasData ? `${sessions.length} entries` : "Your journal entries will appear here"}
          </p>
        </div>
      </div>

      {!hasData ? (
        <Card className="p-12">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No Entries Yet</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Start journaling your rounds and practice sessions to build a history
              of your mental game progress.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/play">
                <Button data-testid="button-new-round">
                  <GolfFlagIcon className="w-4 h-4" />
                  Log a Round
                </Button>
              </Link>
              <Link href="/practice">
                <Button variant="outline" data-testid="button-new-practice">
                  <Target className="w-4 h-4 mr-2" />
                  Log Practice
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all" data-testid="tab-all">
              All ({sessions.length})
            </TabsTrigger>
            <TabsTrigger value="play" data-testid="tab-play">
              Rounds ({playSessions.length})
            </TabsTrigger>
            <TabsTrigger value="practice" data-testid="tab-practice">
              Practice ({practiceSessions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {sessions
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
          </TabsContent>

          <TabsContent value="play" className="space-y-4">
            {playSessions.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No rounds logged yet</p>
              </Card>
            ) : (
              playSessions
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))
            )}
          </TabsContent>

          <TabsContent value="practice" className="space-y-4">
            {practiceSessions.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No practice sessions logged yet</p>
              </Card>
            ) : (
              practiceSessions
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
