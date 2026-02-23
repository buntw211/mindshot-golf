import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
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
  Pencil,
  Save,
  X,
  Image,
} from "lucide-react";
import type { Session, SelfRatings } from "@shared/schema";
import { thoughtCategories, type ThoughtCategory } from "@shared/schema";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

function JournalSection({ title, content, testId, editing, field, editData, onEdit }: {
  title: string;
  content: string | null | undefined;
  testId?: string;
  editing?: boolean;
  field?: string;
  editData?: Record<string, any>;
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
          onChange={(e) => onEdit(field, e.target.value)}
          className="min-h-[100px] resize-none"
          placeholder={`Enter ${title.toLowerCase()}...`}
          data-testid={`edit-${testId}`}
        />
      ) : (
        <p className="text-foreground whitespace-pre-wrap">{content}</p>
      )}
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

const categoryLabels: Record<ThoughtCategory, { label: string; lowLabel: string; highLabel: string }> = {
  "confidence": { label: "Confidence", lowLabel: "Doubting", highLabel: "Confident" },
  "focus": { label: "Focus", lowLabel: "Scattered", highLabel: "Locked In" },
  "frustration": { label: "Frustration Management", lowLabel: "Easily Frustrated", highLabel: "Calm" },
  "anxiety": { label: "Anxiety Level", lowLabel: "Anxious", highLabel: "Relaxed" },
  "patience": { label: "Patience", lowLabel: "Impatient", highLabel: "Patient" },
  "decision-making": { label: "Decision Making", lowLabel: "Uncertain", highLabel: "Decisive" },
  "self-talk": { label: "Self-Talk Quality", lowLabel: "Critical", highLabel: "Supportive" },
  "pressure": { label: "Pressure Handling", lowLabel: "Struggled", highLabel: "Thrived" },
  "expectations": { label: "Expectations", lowLabel: "Unrealistic", highLabel: "Balanced" },
  "acceptance": { label: "Acceptance", lowLabel: "Resisting", highLabel: "Accepting" },
};

function SelfRatingsSection({ ratings, editing, onRatingChange }: {
  ratings: SelfRatings;
  editing?: boolean;
  onRatingChange?: (category: ThoughtCategory, value: number) => void;
}) {
  const entries = Object.entries(ratings).filter(([, val]) => val !== undefined && val !== null);
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
                <Label className="text-sm font-medium">
                  {categoryLabels[category].label}
                </Label>
                <span className="text-sm text-muted-foreground">
                  {(ratings[category] as number) || 5}/10
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
                  value={[(ratings[category] as number) || 5]}
                  onValueChange={([v]) => onRatingChange(category, v)}
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
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [scorecardPreview, setScorecardPreview] = useState<string | null>(null);
  const [scorecardUploading, setScorecardUploading] = useState(false);

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

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const res = await apiRequest("PATCH", `/api/sessions/${params.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", params.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patterns"] });
      setEditing(false);
      setEditData({});
      toast({
        title: "Entry Updated",
        description: "Your journal entry has been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startEditing = () => {
    if (!session) return;
    setEditData({
      courseName: session.courseName || "",
      date: session.date,
      score: session.score,
      practiceType: session.practiceType || "",
      duration: session.duration,
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
    setScorecardPreview(null);
  };

  const handleEdit = (field: string, value: any) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRatingChange = (category: ThoughtCategory, value: number) => {
    setEditData((prev) => ({
      ...prev,
      selfRatings: { ...(prev.selfRatings || {}), [category]: value },
    }));
  };

  const handleSave = () => {
    updateMutation.mutate(editData);
  };

  const handleScorecardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScorecardUploading(true);
    try {
      const formData = new FormData();
      formData.append("scorecard", file);
      const res = await fetch("/api/upload/scorecard", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      handleEdit("scorecardImage", url);
      setScorecardPreview(url);
      toast({ title: "Photo uploaded", description: "Scorecard photo updated." });
    } catch {
      toast({ title: "Upload failed", description: "Could not upload the photo.", variant: "destructive" });
    } finally {
      setScorecardUploading(false);
    }
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
  const selfRatings = editing
    ? (editData.selfRatings as SelfRatings) || {}
    : (session.selfRatings as SelfRatings | null);
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
            </>
          )}
        </div>
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
                {editing ? (
                  <div className="space-y-2">
                    {isPlay ? (
                      <Input
                        value={editData.courseName || ""}
                        onChange={(e) => handleEdit("courseName", e.target.value)}
                        placeholder="Course name"
                        className="text-lg font-semibold"
                        data-testid="edit-input-course"
                      />
                    ) : (
                      <Input
                        value={editData.practiceType || ""}
                        onChange={(e) => handleEdit("practiceType", e.target.value)}
                        placeholder="Practice type"
                        className="text-lg font-semibold"
                        data-testid="edit-input-practice-type"
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={editData.date || ""}
                        onChange={(e) => handleEdit("date", e.target.value)}
                        className="w-auto"
                        data-testid="edit-input-date"
                      />
                      {!isPlay && (
                        <Input
                          type="number"
                          value={editData.duration || ""}
                          onChange={(e) => handleEdit("duration", parseInt(e.target.value) || null)}
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
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={isPlay ? "default" : "secondary"} className="text-sm">
                {isPlay ? "Round" : "Practice"}
              </Badge>
              {session.journalMode && !editing && (
                <Badge variant="outline" className="text-xs" data-testid="badge-journal-mode">
                  {isFreeWrite ? <PenLine className="w-3 h-3 mr-1" /> : <BookOpen className="w-3 h-3 mr-1" />}
                  {isFreeWrite ? "Free Write" : "Guided"}
                </Badge>
              )}
              {isPlay && editing ? (
                <Input
                  type="number"
                  value={editData.score || ""}
                  onChange={(e) => handleEdit("score", parseInt(e.target.value) || null)}
                  placeholder="Score"
                  className="w-20 text-right text-lg font-bold"
                  data-testid="edit-input-score"
                />
              ) : isPlay && session.score ? (
                <span className="text-2xl font-bold" data-testid="text-score">{session.score}</span>
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
                  onValueChange={([v]) => handleEdit("overallMood", v)}
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
                  onValueChange={([v]) => handleEdit("overallFocus", v)}
                  data-testid="edit-slider-focus"
                />
              </div>
            </div>
          ) : (
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
          )}
        </CardHeader>

        <CardContent className="space-y-8">
          {(isFreeWrite || editing) && (
            <JournalSection
              title="Free Writing"
              content={session.freeWriting}
              testId="section-free-writing"
              editing={editing}
              field="freeWriting"
              editData={editData}
              onEdit={handleEdit}
            />
          )}

          <JournalSection
            title={isPlay ? "Pre-Round Mindset" : "Session Goals"}
            content={session.preRoundMindset}
            testId="section-pre-round-mindset"
            editing={editing}
            field="preRoundMindset"
            editData={editData}
            onEdit={handleEdit}
          />
          <JournalSection
            title="Pre-Round Mental State"
            content={session.preRoundMentalState}
            testId="section-pre-round-mental-state"
            editing={editing}
            field="preRoundMentalState"
            editData={editData}
            onEdit={handleEdit}
          />
          <JournalSection
            title="Pre-Round Goals"
            content={session.preRoundGoals}
            testId="section-pre-round-goals"
            editing={editing}
            field="preRoundGoals"
            editData={editData}
            onEdit={handleEdit}
          />
          {(isPlay || editing) && (
            <JournalSection
              title="Pre-Round Routine"
              content={session.preRoundRoutine}
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
                content={session.swingFocus}
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
                      onValueChange={([v]) => handleEdit("confidenceBefore", v)}
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
                      onValueChange={([v]) => handleEdit("confidenceAfter", v)}
                      data-testid="edit-slider-confidence-after"
                    />
                  </div>
                </div>
              ) : (session.confidenceBefore || session.confidenceAfter) && !editing ? (
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
              ) : null}
            </div>
          )}

          <JournalSection
            title="Focus & Presence"
            content={session.focusQuality}
            testId="section-focus-quality"
            editing={editing}
            field="focusQuality"
            editData={editData}
            onEdit={handleEdit}
          />
          <JournalSection
            title="Thought Process"
            content={session.thoughtProcess}
            testId="section-thought-process"
            editing={editing}
            field="thoughtProcess"
            editData={editData}
            onEdit={handleEdit}
          />
          <JournalSection
            title="Key Moments"
            content={session.keyMoments}
            testId="section-key-moments"
            editing={editing}
            field="keyMoments"
            editData={editData}
            onEdit={handleEdit}
          />
          <JournalSection
            title="Miss Patterns"
            content={session.missPattern}
            testId="section-miss-pattern"
            editing={editing}
            field="missPattern"
            editData={editData}
            onEdit={handleEdit}
          />
          <JournalSection
            title="Stroke Gains"
            content={session.strokeGains}
            testId="section-stroke-gains"
            editing={editing}
            field="strokeGains"
            editData={editData}
            onEdit={handleEdit}
          />
          <JournalSection
            title="Game Costs"
            content={session.gameCosts}
            testId="section-game-costs"
            editing={editing}
            field="gameCosts"
            editData={editData}
            onEdit={handleEdit}
          />
          <JournalSection
            title={isPlay ? "Decision Making" : "Quality & Presence"}
            content={session.decisionsReflection}
            testId="section-decisions-reflection"
            editing={editing}
            field="decisionsReflection"
            editData={editData}
            onEdit={handleEdit}
          />
          <JournalSection
            title="Course Management"
            content={session.courseManagement}
            testId="section-course-management"
            editing={editing}
            field="courseManagement"
            editData={editData}
            onEdit={handleEdit}
          />
          <JournalSection
            title="Target Selection"
            content={session.targetSelection}
            testId="section-target-selection"
            editing={editing}
            field="targetSelection"
            editData={editData}
            onEdit={handleEdit}
          />
          <JournalSection
            title="Emotional Decisions"
            content={session.emotionalDecisions}
            testId="section-emotional-decisions"
            editing={editing}
            field="emotionalDecisions"
            editData={editData}
            onEdit={handleEdit}
          />
          <JournalSection
            title="Emotional Highs"
            content={session.emotionalHighs}
            testId="section-emotional-highs"
            editing={editing}
            field="emotionalHighs"
            editData={editData}
            onEdit={handleEdit}
          />
          <JournalSection
            title="Emotional Challenges"
            content={session.emotionalLows}
            testId="section-emotional-lows"
            editing={editing}
            field="emotionalLows"
            editData={editData}
            onEdit={handleEdit}
          />
          <JournalSection
            title="Joy Moments"
            content={session.joyMoments}
            testId="section-joy-moments"
            editing={editing}
            field="joyMoments"
            editData={editData}
            onEdit={handleEdit}
          />
          <JournalSection
            title="Emotional Challenges (Detailed)"
            content={session.emotionalChallenges}
            testId="section-emotional-challenges"
            editing={editing}
            field="emotionalChallenges"
            editData={editData}
            onEdit={handleEdit}
          />
          <JournalSection
            title="Adversity Response"
            content={session.adversityResponse}
            testId="section-adversity-response"
            editing={editing}
            field="adversityResponse"
            editData={editData}
            onEdit={handleEdit}
          />
          <JournalSection
            title="Routine Commitment"
            content={session.routineCommitment}
            testId="section-routine-commitment"
            editing={editing}
            field="routineCommitment"
            editData={editData}
            onEdit={handleEdit}
          />
          <JournalSection
            title={isPlay ? "Lessons Learned" : "What Worked"}
            content={session.lessonsLearned}
            testId="section-lessons-learned"
            editing={editing}
            field="lessonsLearned"
            editData={editData}
            onEdit={handleEdit}
          />
          <JournalSection
            title="Gratitude"
            content={session.gratitude}
            testId="section-gratitude"
            editing={editing}
            field="gratitude"
            editData={editData}
            onEdit={handleEdit}
          />
          <JournalSection
            title="Next Session Goals"
            content={session.nextSessionGoals}
            testId="section-next-goals"
            editing={editing}
            field="nextSessionGoals"
            editData={editData}
            onEdit={handleEdit}
          />

          {selfRatings && (
            <SelfRatingsSection
              ratings={selfRatings}
              editing={editing}
              onRatingChange={handleRatingChange}
            />
          )}

          <div className="space-y-3" data-testid="section-scorecard">
            {editing ? (
              <>
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Scorecard Photo
                </h3>
                {scorecardPreview ? (
                  <div className="relative inline-block">
                    <img
                      src={scorecardPreview}
                      alt="Scorecard"
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
                ) : (
                  <label
                    className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors hover:border-primary/50 hover:bg-primary/5 ${
                      scorecardUploading ? "opacity-50 pointer-events-none" : ""
                    }`}
                    data-testid="label-scorecard-upload"
                  >
                    <Image className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm font-medium">
                      {scorecardUploading ? "Uploading..." : "Tap to add scorecard photo"}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      JPG, PNG, or WEBP up to 10MB
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                      className="hidden"
                      onChange={handleScorecardUpload}
                      disabled={scorecardUploading}
                      data-testid="input-scorecard-upload"
                    />
                  </label>
                )}
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
