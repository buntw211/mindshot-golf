import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Flag,
  Target,
  Calendar,
  Smile,
  Focus,
  ArrowLeft,
  Trash2,
  Clock,
} from "lucide-react";
import type { Session } from "@shared/schema";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

function JournalSection({ title, content }: { title: string; content: string | null }) {
  if (!content) return null;
  
  return (
    <div className="space-y-2">
      <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
        {title}
      </h3>
      <p className="text-foreground whitespace-pre-wrap">{content}</p>
    </div>
  );
}

export default function SessionDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: session, isLoading } = useQuery<Session>({
    queryKey: ["/api/sessions", params.id],
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/sessions/${params.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Entry Deleted",
        description: "Your journal entry has been removed.",
      });
      navigate("/history");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-32 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
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
            This journal entry doesn't exist or has been deleted.
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

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link href="/history">
          <Button variant="ghost" size="sm" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive" data-testid="button-delete">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Journal Entry?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this
                journal entry and all associated data.
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
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${
                isPlay ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"
              }`}>
                {isPlay ? <Flag className="w-7 h-7" /> : <Target className="w-7 h-7" />}
              </div>
              <div>
                <CardTitle className="text-2xl" data-testid="text-session-title">
                  {isPlay ? (session.courseName || "Round") : (session.practiceType || "Practice")}
                </CardTitle>
                <div className="flex items-center gap-4 text-muted-foreground mt-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(session.date), "EEEE, MMMM d, yyyy")}</span>
                  </div>
                  {session.duration && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>{session.duration} min</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={isPlay ? "default" : "secondary"} className="text-sm">
                {isPlay ? "Round" : "Practice"}
              </Badge>
              {isPlay && session.score && (
                <span className="text-2xl font-bold">{session.score}</span>
              )}
            </div>
          </div>

          <div className="flex gap-6 pt-2">
            {session.overallMood && (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                  <Smile className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Mood</div>
                  <div className="font-semibold">{session.overallMood}/10</div>
                </div>
              </div>
            )}
            {session.overallFocus && (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                  <Focus className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Focus</div>
                  <div className="font-semibold">{session.overallFocus}/10</div>
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          <JournalSection
            title={isPlay ? "Pre-Round Mindset" : "Session Goals"}
            content={session.preRoundMindset}
          />
          {isPlay && (
            <JournalSection
              title="Pre-Round Routine"
              content={session.preRoundRoutine}
            />
          )}
          <JournalSection
            title="Key Moments"
            content={session.keyMoments}
          />
          <JournalSection
            title={isPlay ? "Decision Making" : "Quality of Practice"}
            content={session.decisionsReflection}
          />
          {isPlay && (
            <>
              <JournalSection
                title="Emotional Highs"
                content={session.emotionalHighs}
              />
              <JournalSection
                title="Emotional Challenges"
                content={session.emotionalLows}
              />
            </>
          )}
          <JournalSection
            title="Focus & Presence"
            content={session.focusQuality}
          />
          <JournalSection
            title={isPlay ? "Lessons Learned" : "What Worked"}
            content={session.lessonsLearned}
          />
          {session.gratitude && (
            <JournalSection
              title="Gratitude"
              content={session.gratitude}
            />
          )}
          <JournalSection
            title="Next Session Goals"
            content={session.nextSessionGoals}
          />
        </CardContent>
      </Card>
    </div>
  );
}
