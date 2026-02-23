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
  PenLine,
  BookOpen,
  Camera,
} from "lucide-react";
import type { Session, SelfRatings } from "@shared/schema";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

function JournalSection({ title, content, testId }: { title: string; content: string | null | undefined; testId?: string }) {
  if (!content) return null;
  
  return (
    <div className="space-y-2" data-testid={testId}>
      <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
        {title}
      </h3>
      <p className="text-foreground whitespace-pre-wrap">{content}</p>
    </div>
  );
}

const ratingLabels: Record<string, string> = {
  "confidence": "Confidence",
  "focus": "Focus",
  "frustration": "Frustration",
  "anxiety": "Anxiety",
  "patience": "Patience",
  "decision-making": "Decision Making",
  "self-talk": "Self Talk",
  "pressure": "Pressure",
  "expectations": "Expectations",
  "acceptance": "Acceptance",
};

function SelfRatingsSection({ ratings }: { ratings: SelfRatings }) {
  const entries = Object.entries(ratings).filter(([, val]) => val !== undefined && val !== null);
  if (entries.length === 0) return null;

  return (
    <div className="space-y-3" data-testid="section-self-ratings">
      <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
        Self-Assessment Ratings
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-center justify-between bg-accent/30 rounded-md px-3 py-2">
            <span className="text-sm">{ratingLabels[key] || key}</span>
            <span className="font-semibold">{value}/10</span>
          </div>
        ))}
      </div>
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
  const isFreeWrite = session.journalMode === "freeform";
  const selfRatings = session.selfRatings as SelfRatings | null;

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
                <div className="flex items-center gap-4 text-muted-foreground mt-1 flex-wrap">
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
              {session.journalMode && (
                <Badge variant="outline" className="text-xs" data-testid="badge-journal-mode">
                  {isFreeWrite ? <PenLine className="w-3 h-3 mr-1" /> : <BookOpen className="w-3 h-3 mr-1" />}
                  {isFreeWrite ? "Free Write" : "Guided"}
                </Badge>
              )}
              {isPlay && session.score && (
                <span className="text-2xl font-bold" data-testid="text-score">{session.score}</span>
              )}
            </div>
          </div>

          <div className="flex gap-6 pt-2 flex-wrap">
            {session.overallMood && (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                  <Smile className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Mood</div>
                  <div className="font-semibold" data-testid="text-mood">{session.overallMood}/10</div>
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
                  <div className="font-semibold" data-testid="text-focus">{session.overallFocus}/10</div>
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {isFreeWrite && session.freeWriting && (
            <JournalSection
              title="Free Writing"
              content={session.freeWriting}
              testId="section-free-writing"
            />
          )}

          <JournalSection
            title={isPlay ? "Pre-Round Mindset" : "Session Goals"}
            content={session.preRoundMindset}
            testId="section-pre-round-mindset"
          />
          <JournalSection
            title="Pre-Round Mental State"
            content={session.preRoundMentalState}
            testId="section-pre-round-mental-state"
          />
          <JournalSection
            title="Pre-Round Goals"
            content={session.preRoundGoals}
            testId="section-pre-round-goals"
          />
          {isPlay && (
            <JournalSection
              title="Pre-Round Routine"
              content={session.preRoundRoutine}
              testId="section-pre-round-routine"
            />
          )}

          {!isPlay && session.swingFocus && (
            <div className="space-y-4" data-testid="section-swing-focus">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Swing Work
              </h3>
              <p className="text-foreground whitespace-pre-wrap">{session.swingFocus}</p>
              {(session.confidenceBefore || session.confidenceAfter) && (
                <div className="flex gap-6 pt-2 flex-wrap">
                  {session.confidenceBefore && (
                    <div className="flex items-center gap-2 bg-accent/50 rounded-md px-3 py-2">
                      <div className="text-sm text-muted-foreground">Before:</div>
                      <div className="font-semibold">{session.confidenceBefore}/10</div>
                    </div>
                  )}
                  {session.confidenceAfter && (
                    <div className="flex items-center gap-2 bg-accent/50 rounded-md px-3 py-2">
                      <div className="text-sm text-muted-foreground">After:</div>
                      <div className="font-semibold">{session.confidenceAfter}/10</div>
                    </div>
                  )}
                  {session.confidenceBefore && session.confidenceAfter && (
                    <div className={`flex items-center gap-2 rounded-md px-3 py-2 ${
                      session.confidenceAfter > session.confidenceBefore 
                        ? "bg-primary/10 text-primary" 
                        : session.confidenceAfter < session.confidenceBefore
                        ? "bg-destructive/10 text-destructive"
                        : "bg-accent/50"
                    }`}>
                      <div className="text-sm">
                        {session.confidenceAfter > session.confidenceBefore 
                          ? `+${session.confidenceAfter - session.confidenceBefore} improvement`
                          : session.confidenceAfter < session.confidenceBefore
                          ? `${session.confidenceAfter - session.confidenceBefore} drop`
                          : "No change"}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <JournalSection
            title="Focus & Presence"
            content={session.focusQuality}
            testId="section-focus-quality"
          />
          <JournalSection
            title="Thought Process"
            content={session.thoughtProcess}
            testId="section-thought-process"
          />

          <JournalSection
            title="Key Moments"
            content={session.keyMoments}
            testId="section-key-moments"
          />

          <JournalSection
            title="Miss Patterns"
            content={session.missPattern}
            testId="section-miss-pattern"
          />
          <JournalSection
            title="Stroke Gains"
            content={session.strokeGains}
            testId="section-stroke-gains"
          />
          <JournalSection
            title="Game Costs"
            content={session.gameCosts}
            testId="section-game-costs"
          />

          <JournalSection
            title={isPlay ? "Decision Making" : "Quality & Presence"}
            content={session.decisionsReflection}
            testId="section-decisions-reflection"
          />
          <JournalSection
            title="Course Management"
            content={session.courseManagement}
            testId="section-course-management"
          />
          <JournalSection
            title="Target Selection"
            content={session.targetSelection}
            testId="section-target-selection"
          />
          <JournalSection
            title="Emotional Decisions"
            content={session.emotionalDecisions}
            testId="section-emotional-decisions"
          />

          <JournalSection
            title="Emotional Highs"
            content={session.emotionalHighs}
            testId="section-emotional-highs"
          />
          <JournalSection
            title="Emotional Challenges"
            content={session.emotionalLows}
            testId="section-emotional-lows"
          />
          <JournalSection
            title="Joy Moments"
            content={session.joyMoments}
            testId="section-joy-moments"
          />
          <JournalSection
            title="Emotional Challenges (Detailed)"
            content={session.emotionalChallenges}
            testId="section-emotional-challenges"
          />

          <JournalSection
            title="Adversity Response"
            content={session.adversityResponse}
            testId="section-adversity-response"
          />
          <JournalSection
            title="Routine Commitment"
            content={session.routineCommitment}
            testId="section-routine-commitment"
          />

          <JournalSection
            title={isPlay ? "Lessons Learned" : "What Worked"}
            content={session.lessonsLearned}
            testId="section-lessons-learned"
          />
          <JournalSection
            title="Gratitude"
            content={session.gratitude}
            testId="section-gratitude"
          />
          <JournalSection
            title="Next Session Goals"
            content={session.nextSessionGoals}
            testId="section-next-goals"
          />

          {selfRatings && <SelfRatingsSection ratings={selfRatings} />}

          {session.scorecardImage && (
            <div className="space-y-3" data-testid="section-scorecard">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Scorecard Photo
              </h3>
              <a href={session.scorecardImage} target="_blank" rel="noopener noreferrer">
                <img
                  src={session.scorecardImage}
                  alt="Scorecard"
                  className="rounded-lg border max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                  data-testid="img-scorecard"
                />
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
