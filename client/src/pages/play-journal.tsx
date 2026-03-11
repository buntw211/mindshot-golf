import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Lightbulb, ChevronRight, ChevronLeft, Save, Sparkles, BookOpen, PenLine, CheckCircle, MapPin, Target, Calendar, Camera, X, Image } from "lucide-react";
import { GolfFlagIcon } from "@/components/golf-flag-icon";
import { insertSessionSchema, thoughtCategories, selfRatingsSchema, type ThoughtCategory, type SelfRatings } from "@shared/schema";

const playFormSchema = insertSessionSchema.extend({
  type: z.literal("play"),
  courseName: z.string().min(1, "Please enter the course name"),
  date: z.string().min(1, "Please select a date"),
  score: z.coerce.number().min(50).max(150).optional(),
  overallMood: z.number().min(1).max(10),
  overallFocus: z.number().min(1).max(10),
  selfRatings: selfRatingsSchema.optional(),
});

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

type PlayFormData = z.infer<typeof playFormSchema>;

const guidedQuestions = [
  {
    section: "Pre Round",
    fields: ["preRoundMentalState", "preRoundGoals", "preRoundRoutine"],
    questions: [
      { field: "preRoundMentalState", label: "Mental State", question: "What was your mental state before teeing off?" },
      { field: "preRoundGoals", label: "Mental Goals", question: "What were your mental goals for the round (such as committing to every shot)?" },
      { field: "preRoundRoutine", label: "Pre-Round Routine", question: "Did you stick to your pre-round routine?" },
    ],
  },
  {
    section: "Focus & Presence",
    fields: ["focusQuality"],
    questions: [
      { field: "focusQuality", label: "Focus Quality", question: "How present were you throughout the round? When did your mind wander? What helped you refocus?" },
    ],
  },
  {
    section: "Thought Process",
    fields: ["thoughtProcess"],
    questions: [
      { field: "thoughtProcess", label: "Thought Process", question: "What were you thinking about during key shots? Were your thoughts helpful or distracting? What self-talk patterns did you notice?" },
    ],
  },
  {
    section: "Performance & Mechanics",
    fields: ["missPattern", "strokeGains", "gameCosts"],
    questions: [
      { field: "missPattern", label: "Miss Pattern", question: "What miss showed up repeatedly?" },
      { field: "strokeGains", label: "Stroke Gains", question: "Where did you gain strokes?" },
      { field: "gameCosts", label: "Game Costs", question: "What part of your game cost you the most shots?" },
    ],
  },
  {
    section: "Decisions",
    fields: ["courseManagement", "targetSelection", "emotionalDecisions"],
    questions: [
      { field: "courseManagement", label: "Course Management", question: "Where did course management save or cost you shots?" },
      { field: "targetSelection", label: "Target Selection", question: "Did you choose appropriate targets?" },
      { field: "emotionalDecisions", label: "Emotional Decisions", question: "Did you let emotions cause you to make poor decisions?" },
    ],
  },
  {
    section: "Mental",
    fields: ["adversityResponse", "routineCommitment", "joyMoments", "emotionalChallenges"],
    questions: [
      { field: "adversityResponse", label: "Adversity Response", question: "How did you respond after a bad hole or shot?" },
      { field: "routineCommitment", label: "Routine Commitment", question: "Did you stay committed to your routine? If not, why?" },
      { field: "joyMoments", label: "Joy Moments", question: "What moments brought you joy?" },
      { field: "emotionalChallenges", label: "Emotional Challenges", question: "What challenged you emotionally and how did you handle it?" },
    ],
  },
  {
    section: "Self-Assessment",
    fields: ["selfRatings"],
    questions: [],
    isSelfAssessment: true,
  },
];

const reframingTips: Record<ThoughtCategory, { negative: string; reframe: string }[]> = {
  "confidence": [
    { negative: "I can't make this shot", reframe: "I've practiced this. Trust my preparation and commit to the target." },
    { negative: "I'm playing terribly", reframe: "Each shot is a fresh opportunity. Stay present with this one." },
  ],
  "focus": [
    { negative: "I keep thinking about that last hole", reframe: "What's done is done. My only job now is this shot, this moment." },
    { negative: "I can't concentrate", reframe: "Take a breath. Feel my feet on the ground. See my target clearly." },
  ],
  "frustration": [
    { negative: "This is so frustrating", reframe: "Frustration is just energy. I can channel this into focused intensity." },
    { negative: "Why does this keep happening", reframe: "Every challenge is data for improvement. What can I learn here?" },
  ],
  "anxiety": [
    { negative: "I'm so nervous about this shot", reframe: "Nerves mean I care. Take a breath, stick to my routine." },
    { negative: "What if I mess this up", reframe: "Focus on process, not outcome. Execute my routine and accept the result." },
  ],
  "patience": [
    { negative: "I need to force something here", reframe: "Good golf happens one shot at a time. Trust the process." },
    { negative: "My game should be better by now", reframe: "Improvement isn't linear. Every round teaches me something." },
  ],
  "decision-making": [
    { negative: "I don't know what to do", reframe: "Trust my instinct. Pick a clear target and commit fully." },
    { negative: "I should have played differently", reframe: "I made the best decision with the information I had. Move forward." },
  ],
  "self-talk": [
    { negative: "I'm an idiot", reframe: "I'm human. One shot doesn't define me or my round." },
    { negative: "I always choke under pressure", reframe: "I'm learning to perform under pressure. Each opportunity makes me stronger." },
  ],
  "pressure": [
    { negative: "Everyone is watching me", reframe: "Most people are focused on their own game. I play for myself." },
    { negative: "This shot is too important", reframe: "It's just another shot. Same routine, same process." },
  ],
  "expectations": [
    { negative: "I should be scoring better", reframe: "Expectations create pressure. Focus on playing each shot well." },
    { negative: "I'm supposed to be good at this", reframe: "I'm on my own journey. Comparison steals joy from the game." },
  ],
  "acceptance": [
    { negative: "This round is ruined", reframe: "I can still enjoy this moment and learn from this experience." },
    { negative: "I can't accept this result", reframe: "Acceptance doesn't mean approval. It means I can move forward freely." },
  ],
};

type JournalMode = "guided" | "freewriting" | null;

export default function PlayJournal() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [journalMode, setJournalMode] = useState<JournalMode>(null);
  const [step, setStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<ThoughtCategory | null>(null);
  const [scorecardPreview, setScorecardPreview] = useState<string | null>(null);
  const [scorecardUploading, setScorecardUploading] = useState(false);
  const form = useForm<PlayFormData>({
    resolver: zodResolver(playFormSchema),
    defaultValues: {
      type: "play",
      date: new Date().toISOString().split("T")[0],
      courseName: "",
      score: undefined,
      overallMood: 5,
      overallFocus: 5,
      focusQuality: "",
      thoughtProcess: "",
      preRoundMentalState: "",
      preRoundGoals: "",
      preRoundRoutine: "",
      missPattern: "",
      strokeGains: "",
      gameCosts: "",
      courseManagement: "",
      targetSelection: "",
      emotionalDecisions: "",
      adversityResponse: "",
      routineCommitment: "",
      joyMoments: "",
      emotionalChallenges: "",
      journalMode: "",
      freeWriting: "",
      selfRatings: {
        confidence: 5,
        focus: 5,
        frustration: 5,
        anxiety: 5,
        patience: 5,
        "decision-making": 5,
        "self-talk": 5,
        pressure: 5,
        expectations: 5,
        acceptance: 5,
      },
    },
  });

  const selfRatings = form.watch("selfRatings") || {};

  const updateSelfRating = (category: ThoughtCategory, value: number) => {
    form.setValue("selfRatings", {
      ...selfRatings,
      [category]: value,
    } as SelfRatings, { shouldDirty: true, shouldTouch: true });
  };

  const mutation = useMutation({
    mutationFn: async (data: PlayFormData) => {
      const res = await apiRequest("POST", "/api/sessions", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Round Saved",
        description: "Your mental game journal entry has been saved.",
      });
      navigate(`/sessions/${data.id}`);
    },
    onError: (error: any) => {
      const errorMsg = error?.message || "";
      if (errorMsg.includes("403") || errorMsg.includes("limit")) {
        toast({
          title: "Free Entry Limit Reached",
          description: "You've used all 4 free journal entries. Subscribe to continue.",
          variant: "destructive",
        });
        navigate("/subscribe");
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save your entry. Please try again.",
        variant: "destructive",
      });
    },
  });

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
      form.setValue("scorecardImage", url);
      setScorecardPreview(url);
      toast({ title: "Photo uploaded", description: "Scorecard photo attached to your entry." });
    } catch {
      toast({ title: "Upload failed", description: "Could not upload the photo. Please try again.", variant: "destructive" });
    } finally {
      setScorecardUploading(false);
    }
  };

  const removeScorecardPhoto = () => {
    form.setValue("scorecardImage", "");
    setScorecardPreview(null);
  };

  const onSubmit = (data: PlayFormData) => {
    mutation.mutate(data);
  };

  // Steps: mode select + details + content steps + self-assessment + review & submit
  const totalSteps = journalMode === "freewriting" ? 5 : guidedQuestions.length + 3;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <GolfFlagIcon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold" data-testid="text-play-title">Post-Round Journal</h1>
          <p className="text-muted-foreground">Reflect on your mental game</p>
        </div>
      </div>

      <div className="flex gap-1 mb-6">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      <Form {...form}>
        <form 
          onSubmit={form.handleSubmit(onSubmit)} 
          className="space-y-6"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !(e.target instanceof HTMLTextAreaElement)) {
              e.preventDefault();
            }
          }}
        >
          {step === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Choose Your Journal Style</CardTitle>
                <CardDescription>How would you like to reflect on your round?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setJournalMode("guided");
                      form.setValue("journalMode", "guided");
                      setStep(1);
                    }}
                    className={`p-6 rounded-lg border-2 text-left transition-all hover-elevate ${
                      journalMode === "guided" ? "border-primary bg-primary/5" : "border-muted"
                    }`}
                    data-testid="button-guided-mode"
                  >
                    <BookOpen className="w-8 h-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">Guided Questions</h3>
                    <p className="text-sm text-muted-foreground">
                      Structured prompts to help you reflect on pre-round prep, focus, decisions, and mental game.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setJournalMode("freewriting");
                      form.setValue("journalMode", "freewriting");
                      setStep(1);
                    }}
                    className={`p-6 rounded-lg border-2 text-left transition-all hover-elevate ${
                      journalMode === "freewriting" ? "border-primary bg-primary/5" : "border-muted"
                    }`}
                    data-testid="button-freewriting-mode"
                  >
                    <PenLine className="w-8 h-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">Free Writing</h3>
                    <p className="text-sm text-muted-foreground">
                      Open-ended reflection with a simple prompt: "How did you do?"
                    </p>
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Round Details</CardTitle>
                <CardDescription>Basic information about your round</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="courseName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter course name" {...field} data-testid="input-course-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="score"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Score (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="72"
                          {...field}
                          value={field.value || ""}
                          data-testid="input-score"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                  <FormField
                    control={form.control}
                    name="overallMood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Overall Mood: {field.value}/10</FormLabel>
                        <FormControl>
                          <Slider
                            min={1}
                            max={10}
                            step={1}
                            value={[field.value]}
                            onValueChange={([v]) => field.onChange(v)}
                            data-testid="slider-mood"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="overallFocus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Overall Focus: {field.value}/10</FormLabel>
                        <FormControl>
                          <Slider
                            min={1}
                            max={10}
                            step={1}
                            value={[field.value]}
                            onValueChange={([v]) => field.onChange(v)}
                            data-testid="slider-focus"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Camera className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Scorecard Photo (optional)</span>
                  </div>
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
                </div>
              </CardContent>
            </Card>
          )}

          {journalMode === "freewriting" && step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>How Did You Do?</CardTitle>
                <CardDescription>Reflect freely on your round - thoughts, feelings, key moments, lessons learned</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="freeWriting"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Write your thoughts about your round..."
                          className="min-h-[300px] resize-none"
                          {...field}
                          value={field.value as string || ""}
                          data-testid="textarea-freewriting"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {journalMode === "freewriting" && step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Self-Assessment</CardTitle>
                <CardDescription>Rate how you felt in each mental category to compare with your journal analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {thoughtCategories.map((category) => (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium">
                        {categoryLabels[category].label}
                      </Label>
                      <span className="text-sm text-muted-foreground">
                        {(selfRatings as SelfRatings)[category] || 5}/10
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
                        value={[(selfRatings as SelfRatings)[category] || 5]}
                        onValueChange={([v]) => updateSelfRating(category, v)}
                        className="flex-1"
                        data-testid={`slider-freewrite-self-${category}`}
                      />
                      <span className="text-xs text-muted-foreground w-20">
                        {categoryLabels[category].highLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {journalMode === "guided" && step > 1 && step <= guidedQuestions.length + 1 && (
            <Card>
              <CardHeader>
                <CardTitle>{guidedQuestions[step - 2].section}</CardTitle>
                <CardDescription>
                  {(guidedQuestions[step - 2] as any).isSelfAssessment
                    ? "Rate how you felt in each mental category to compare with your journal analysis"
                    : "Take your time to reflect honestly"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {(guidedQuestions[step - 2] as any).isSelfAssessment ? (
                  <div className="space-y-4">
                    {thoughtCategories.map((category) => (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-sm font-medium">
                            {categoryLabels[category].label}
                          </Label>
                          <span className="text-sm text-muted-foreground">
                            {(selfRatings as SelfRatings)[category] || 5}/10
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
                            value={[(selfRatings as SelfRatings)[category] || 5]}
                            onValueChange={([v]) => updateSelfRating(category, v)}
                            className="flex-1"
                            data-testid={`slider-self-${category}`}
                          />
                          <span className="text-xs text-muted-foreground w-20">
                            {categoryLabels[category].highLabel}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  guidedQuestions[step - 2].questions.map((q) => (
                    <FormField
                      key={q.field}
                      control={form.control}
                      name={q.field as keyof PlayFormData}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{q.label}</FormLabel>
                          <p className="text-sm text-muted-foreground mb-2">{q.question}</p>
                          <FormControl>
                            <Textarea
                              placeholder="Write your thoughts..."
                              className="min-h-[120px] resize-none"
                              {...field}
                              value={field.value as string || ""}
                              data-testid={`textarea-${q.field}`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* Review & Submit Step - Final step for both modes */}
          {step === totalSteps - 1 && (
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  Ready to Submit?
                </CardTitle>
                <CardDescription>
                  Review your entry before saving
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{form.watch("courseName") || "No course name"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {form.watch("date") ? new Date(form.watch("date")).toLocaleDateString() : "No date"}
                    </span>
                  </div>
                  {form.watch("score") && (
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Score: {form.watch("score")}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Mood: {form.watch("overallMood")}/10</span>
                    <span>Focus: {form.watch("overallFocus")}/10</span>
                  </div>
                </div>
                {scorecardPreview && (
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Camera className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Scorecard photo attached</span>
                    </div>
                    <img
                      src={scorecardPreview}
                      alt="Scorecard"
                      className="rounded-lg border max-h-32 object-contain"
                    />
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-4">
                  Click "Save Entry" below to save your journal entry. You can view and review your entries in the Journal History section.
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="bg-accent/30 border-accent">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary" />
                <CardTitle className="text-base">Reframing Tips</CardTitle>
              </div>
              <CardDescription>
                Select a thought category to see helpful reframes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {thoughtCategories.map((cat) => (
                  <Badge
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    className="cursor-pointer capitalize"
                    onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                    data-testid={`badge-category-${cat}`}
                  >
                    {cat.replace("-", " ")}
                  </Badge>
                ))}
              </div>
              {selectedCategory && reframingTips[selectedCategory] && (
                <div className="space-y-3">
                  {reframingTips[selectedCategory].map((tip, i) => (
                    <div key={i} className="p-3 bg-card rounded-md border">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-destructive font-medium text-sm">Negative:</span>
                        <span className="text-sm italic">"{tip.negative}"</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-sm font-medium text-primary">"{tip.reframe}"</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (step === 1) {
                  setJournalMode(null);
                  form.setValue("journalMode", "");
                }
                setStep(Math.max(0, step - 1));
              }}
              disabled={step === 0}
              data-testid="button-prev"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            {step < totalSteps - 1 ? (
              <Button
                type="button"
                onClick={() => setStep(step + 1)}
                data-testid="button-next"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button type="submit" disabled={mutation.isPending} data-testid="button-save">
                <Save className="w-4 h-4 mr-2" />
                {mutation.isPending ? "Saving..." : "Save Entry"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
