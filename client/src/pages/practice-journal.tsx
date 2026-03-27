import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Lightbulb, ChevronRight, ChevronLeft, Save, Sparkles, Camera, X, Image } from "lucide-react";
import { DrivingRangeIcon } from "@/components/driving-range-icon";
import { insertSessionSchema, thoughtCategories, selfRatingsSchema, type ThoughtCategory, type SelfRatings } from "@shared/schema";
import { Label } from "@/components/ui/label";

const practiceFormSchema = insertSessionSchema.extend({
  type: z.literal("practice"),
  practiceType: z.string().min(1, "Please select a practice type"),
  date: z.string().min(1, "Please select a date"),
  duration: z.coerce.number().min(1, "Please enter duration").max(480),
  overallMood: z.number().min(1).max(10),
  overallFocus: z.number().min(1).max(10),
  selfRatings: selfRatingsSchema.optional(),
});

type PracticeFormData = z.infer<typeof practiceFormSchema>;

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

const practiceTypes = [
  "Driving Range",
  "Short Game",
  "Putting",
  "Bunker Practice",
  "Course Practice",
  "Simulator",
  "Mental Rehearsal",
  "Physical Training",
];

const guidedQuestions = [
  {
    section: "Practice Intent",
    fields: ["preRoundMindset"],
    questions: [
      { field: "preRoundMindset", label: "Session Goals", question: "What specific skills or mental aspects did you want to work on today?" },
    ],
  },
  {
    section: "Swing Work",
    fields: ["swingFocus"],
    questions: [
      { field: "swingFocus", label: "What You Worked On", question: "What swing changes or techniques were you focusing on? What adjustments did you make?" },
    ],
    hasConfidenceTracking: true,
  },
  {
    section: "The Work",
    fields: ["keyMoments", "decisionsReflection"],
    questions: [
      { field: "keyMoments", label: "Key Moments", question: "What breakthrough moments or challenges did you experience?" },
      { field: "decisionsReflection", label: "Quality & Presence", question: "How intentional and focused was your practice? Were you fully present or going through the motions?" },
    ],
  },
  {
    section: "Takeaways",
    fields: ["lessonsLearned", "nextSessionGoals"],
    questions: [
      { field: "lessonsLearned", label: "What Worked", question: "What insights or improvements can you take to the course?" },
      { field: "nextSessionGoals", label: "Next Practice Goals", question: "What will you focus on in your next practice session?" },
    ],
  },
  {
    section: "Self-Assessment",
    fields: ["selfRatings"],
    questions: [],
    isSelfAssessment: true,
  },
];

const practiceReframingTips: Record<ThoughtCategory, { negative: string; reframe: string }[]> = {
  "confidence": [
    { negative: "I'll never get better at this", reframe: "Every repetition builds skill. Trust the process of improvement." },
    { negative: "I'm wasting my time", reframe: "Deliberate practice is the path to mastery. I'm investing in my future game." },
  ],
  "focus": [
    { negative: "I'm just going through the motions", reframe: "Stop. Set a clear intention for the next 10 shots. Quality over quantity." },
    { negative: "My mind keeps wandering", reframe: "Bring attention back to one specific feel or target. Narrow the focus." },
  ],
  "frustration": [
    { negative: "Why isn't this working", reframe: "Struggle is part of learning. What small adjustment can I try?" },
    { negative: "I keep making the same mistake", reframe: "Awareness is the first step. Now I can experiment with solutions." },
  ],
  "anxiety": [
    { negative: "I'm anxious about my game", reframe: "Practice is the safe space to experiment. No score, no pressure." },
    { negative: "What if I'm practicing wrong", reframe: "There's no perfect way. Stay curious and keep learning." },
  ],
  "patience": [
    { negative: "I want results now", reframe: "Skill develops over time. Today's work will show up in future rounds." },
    { negative: "This is taking too long", reframe: "Embrace the journey. Enjoy the process of becoming better." },
  ],
  "decision-making": [
    { negative: "I don't know what to practice", reframe: "Start with what challenged me in my last round. Work backwards." },
    { negative: "Should I change my technique", reframe: "Make one small change at a time. Test it thoroughly before moving on." },
  ],
  "self-talk": [
    { negative: "I'm so bad at this", reframe: "I'm learning. Every expert was once a beginner." },
    { negative: "Other people improve faster", reframe: "I'm on my own path. Focus on my own progress." },
  ],
  "pressure": [
    { negative: "I need to perfect this before my round", reframe: "Practice builds foundation. Trust that work will show up when needed." },
    { negative: "I have to fix everything", reframe: "Focus on one thing at a time. Small improvements compound." },
  ],
  "expectations": [
    { negative: "I should be better by now", reframe: "Skill development isn't linear. Keep showing up." },
    { negative: "This practice isn't productive", reframe: "Any time spent with a club in hand builds feel and connection." },
  ],
  "acceptance": [
    { negative: "Today's practice was a waste", reframe: "Even challenging sessions teach us something. What did I learn?" },
    { negative: "I can't accept where my game is", reframe: "Acceptance allows me to work from where I am, not where I wish I was." },
  ],
};

export default function PracticeJournal() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<ThoughtCategory | null>(null);
  const [scorecardPreview, setScorecardPreview] = useState<string | null>(null);
  const [scorecardUploading, setScorecardUploading] = useState(false);
  const form = useForm<PracticeFormData>({
    resolver: zodResolver(practiceFormSchema),
    defaultValues: {
      type: "practice",
      date: new Date().toISOString().split("T")[0],
      practiceType: "",
      duration: 60,
      overallMood: 5,
      overallFocus: 5,
      preRoundMindset: "",
      keyMoments: "",
      decisionsReflection: "",
      swingFocus: "",
      confidenceBefore: 5,
      confidenceAfter: 5,
      lessonsLearned: "",
      nextSessionGoals: "",
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
const { data: subInfo } = useQuery({
  queryKey: ["/api/subscription"],
});
  const updateSelfRating = (category: ThoughtCategory, value: number) => {
    form.setValue("selfRatings", {
      ...selfRatings,
      [category]: value,
    } as SelfRatings, { shouldDirty: true, shouldTouch: true });
  };

  const mutation = useMutation({
    mutationFn: async (data: PracticeFormData) => {
      const res = await apiRequest("POST", "/api/sessions", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Practice Session Saved",
        description: "Your mental game journal entry has been saved.",
      });
      navigate(`/session/${data.id}`);
    },
    onError: () => {
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

  const onSubmit = (data: PracticeFormData) => {
  if (!subInfo?.isSubscribed && subInfo?.freeEntriesRemaining === 0) {
    toast({
      title: "Free limit reached",
      description: "Upgrade to continue journaling",
    });

    setTimeout(() => {
      window.location.href = "/subscribe";
    }, 800);

    return;
  }

  mutation.mutate(data);
};

  const totalSteps = guidedQuestions.length + 2;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
          <DrivingRangeIcon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold" data-testid="text-practice-title">Practice Session Journal</h1>
          <p className="text-muted-foreground">Reflect on your practice</p>
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
                <CardTitle>Practice Details</CardTitle>
                <CardDescription>Basic information about your session</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="practiceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Practice Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-practice-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {practiceTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="60"
                          {...field}
                          data-testid="input-duration"
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

          {step > 0 && step <= guidedQuestions.length && (
            <Card>
              <CardHeader>
                <CardTitle>{guidedQuestions[step - 1].section}</CardTitle>
                <CardDescription>
                  {(guidedQuestions[step - 1] as any).isSelfAssessment
                    ? "Rate how you felt in each mental category to compare with your journal analysis"
                    : "Take your time to reflect honestly"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {(guidedQuestions[step - 1] as any).isSelfAssessment ? (
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
                  guidedQuestions[step - 1].questions.map((q) => (
                    <FormField
                      key={q.field}
                      control={form.control}
                      name={q.field as keyof PracticeFormData}
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
                
                {(guidedQuestions[step - 1] as { hasConfidenceTracking?: boolean }).hasConfidenceTracking && (
                  <div className="space-y-6 pt-4 border-t">
                    <h4 className="font-medium text-sm text-muted-foreground">How confident do you feel about these changes?</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="confidenceBefore"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Before Practice: {field.value}/10</FormLabel>
                            <p className="text-xs text-muted-foreground mb-2">How confident were you in the change when you started?</p>
                            <FormControl>
                              <Slider
                                min={1}
                                max={10}
                                step={1}
                                value={[field.value || 5]}
                                onValueChange={([v]) => field.onChange(v)}
                                data-testid="slider-confidence-before"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="confidenceAfter"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>After Practice: {field.value}/10</FormLabel>
                            <p className="text-xs text-muted-foreground mb-2">How confident are you now after working on it?</p>
                            <FormControl>
                              <Slider
                                min={1}
                                max={10}
                                step={1}
                                value={[field.value || 5]}
                                onValueChange={([v]) => field.onChange(v)}
                                data-testid="slider-confidence-after"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {step === totalSteps - 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Review & Submit</CardTitle>
                <CardDescription>Review your entry before saving</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Practice Type:</span>
                    <p className="font-medium" data-testid="text-review-practice-type">{form.getValues("practiceType") || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date:</span>
                    <p className="font-medium" data-testid="text-review-date">{form.getValues("date")}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <p className="font-medium" data-testid="text-review-duration">{form.getValues("duration")} minutes</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Mood / Focus:</span>
                    <p className="font-medium" data-testid="text-review-mood-focus">{form.getValues("overallMood")}/10 &middot; {form.getValues("overallFocus")}/10</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground pt-2">
                  Press <strong>Save Entry</strong> when you're ready, or go back to make changes.
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="bg-accent/30 border-accent">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary" />
                <CardTitle className="text-base">Practice Reframing Tips</CardTitle>
              </div>
              <CardDescription>
                Select a thought category to see helpful reframes for practice
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
              {selectedCategory && practiceReframingTips[selectedCategory] && (
                <div className="space-y-3">
                  {practiceReframingTips[selectedCategory].map((tip, i) => (
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
              onClick={() => setStep(Math.max(0, step - 1))}
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
