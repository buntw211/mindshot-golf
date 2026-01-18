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
import { Flag, Lightbulb, ChevronRight, ChevronLeft, Save, Sparkles } from "lucide-react";
import { insertSessionSchema, thoughtCategories, type ThoughtCategory } from "@shared/schema";

const playFormSchema = insertSessionSchema.extend({
  type: z.literal("play"),
  courseName: z.string().min(1, "Please enter the course name"),
  date: z.string().min(1, "Please select a date"),
  score: z.coerce.number().min(50).max(150).optional(),
  overallMood: z.number().min(1).max(10),
  overallFocus: z.number().min(1).max(10),
});

type PlayFormData = z.infer<typeof playFormSchema>;

const guidedQuestions = [
  {
    section: "Before the Round",
    fields: ["preRoundMindset"],
    questions: [
      { field: "preRoundMindset", label: "Pre-Round Mindset", question: "What was your mental state before teeing off? What expectations did you have?" },
    ],
  },
  {
    section: "During the Round",
    fields: ["keyMoments", "decisionsReflection"],
    questions: [
      { field: "keyMoments", label: "Key Moments", question: "Describe 2-3 moments that stood out mentally. What happened? How did you respond?" },
      { field: "decisionsReflection", label: "Decision Making", question: "Reflect on your course management and shot decisions. Which choices felt confident? Which ones were rushed?" },
    ],
  },
  {
    section: "Emotional Journey",
    fields: ["emotionalHighs", "emotionalLows"],
    questions: [
      { field: "emotionalHighs", label: "Emotional Highs", question: "What moments brought you joy or confidence today?" },
      { field: "emotionalLows", label: "Emotional Challenges", question: "What moments challenged you emotionally? How did you handle frustration or disappointment?" },
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
    section: "Lessons & Growth",
    fields: ["lessonsLearned", "gratitude", "nextSessionGoals"],
    questions: [
      { field: "lessonsLearned", label: "Lessons Learned", question: "What did this round teach you about your mental game?" },
      { field: "gratitude", label: "Gratitude", question: "What are you grateful for from today's round?" },
      { field: "nextSessionGoals", label: "Next Round Goals", question: "What mental skill will you focus on next time?" },
    ],
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

export default function PlayJournal() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<ThoughtCategory | null>(null);

  const form = useForm<PlayFormData>({
    resolver: zodResolver(playFormSchema),
    defaultValues: {
      type: "play",
      date: new Date().toISOString().split("T")[0],
      courseName: "",
      score: undefined,
      overallMood: 5,
      overallFocus: 5,
      preRoundMindset: "",
      keyMoments: "",
      decisionsReflection: "",
      emotionalHighs: "",
      emotionalLows: "",
      focusQuality: "",
      lessonsLearned: "",
      gratitude: "",
      nextSessionGoals: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: PlayFormData) => {
      const res = await apiRequest("POST", "/api/sessions", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Round Saved",
        description: "Your mental game journal entry has been saved.",
      });
      navigate("/history");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save your entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PlayFormData) => {
    mutation.mutate(data);
  };

  const totalSteps = guidedQuestions.length + 1;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Flag className="w-6 h-6 text-primary" />
        </div>
        <div>
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {step === 0 && (
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
              </CardContent>
            </Card>
          )}

          {step > 0 && step <= guidedQuestions.length && (
            <Card>
              <CardHeader>
                <CardTitle>{guidedQuestions[step - 1].section}</CardTitle>
                <CardDescription>Take your time to reflect honestly</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {guidedQuestions[step - 1].questions.map((q) => (
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
                ))}
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
