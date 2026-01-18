import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lightbulb, Sparkles, Flag, Target } from "lucide-react";
import { thoughtCategories, type ThoughtCategory } from "@shared/schema";

const playTips: Record<ThoughtCategory, { negative: string; reframe: string; explanation: string }[]> = {
  "confidence": [
    { 
      negative: "I can't make this shot", 
      reframe: "I've practiced this. Trust my preparation and commit to the target.",
      explanation: "Confidence comes from trusting your preparation, not the outcome. Commit fully to your process."
    },
    { 
      negative: "I'm playing terribly today", 
      reframe: "Each shot is a fresh opportunity. Stay present with this one.",
      explanation: "Your next shot knows nothing about your previous ones. Reset your mental state with each swing."
    },
    { 
      negative: "I don't belong on this course", 
      reframe: "I'm here to learn and enjoy the game. Every golfer starts somewhere.",
      explanation: "Focus on your own journey rather than comparing yourself to others or the course difficulty."
    },
  ],
  "focus": [
    { 
      negative: "I keep thinking about that last hole", 
      reframe: "What's done is done. My only job now is this shot, this moment.",
      explanation: "Dwelling on past holes steals energy from the present. Practice letting go between shots."
    },
    { 
      negative: "I can't concentrate today", 
      reframe: "Take a breath. Feel my feet on the ground. See my target clearly.",
      explanation: "When focus wavers, return to physical sensations. Grounding yourself brings you back to the present."
    },
    { 
      negative: "There are too many distractions", 
      reframe: "Narrow my world to just me, the ball, and my target.",
      explanation: "Create a mental bubble during your routine. Everything else can wait until after your swing."
    },
  ],
  "frustration": [
    { 
      negative: "This is so frustrating", 
      reframe: "Frustration is just energy. I can channel this into focused intensity.",
      explanation: "The energy of frustration can be redirected into determination and heightened focus."
    },
    { 
      negative: "Why does this keep happening to me", 
      reframe: "Every challenge is data for improvement. What can I learn here?",
      explanation: "Approach difficulties with curiosity rather than judgment. Each setback teaches something valuable."
    },
    { 
      negative: "I want to throw this club", 
      reframe: "I acknowledge my frustration, take a breath, and choose to respond calmly.",
      explanation: "Recognizing the emotion is the first step. Then choose a response that serves your game."
    },
  ],
  "anxiety": [
    { 
      negative: "I'm so nervous about this shot", 
      reframe: "Nerves mean I care. Take a breath, stick to my routine.",
      explanation: "Anxiety and excitement produce the same physical response. Reframe nerves as readiness."
    },
    { 
      negative: "What if I mess this up", 
      reframe: "Focus on process, not outcome. Execute my routine and accept the result.",
      explanation: "You can't control outcomes, only your process. Trust your preparation and let go of results."
    },
    { 
      negative: "Everyone is watching me", 
      reframe: "Most people are focused on their own game. I play for myself.",
      explanation: "The spotlight effect makes us think others notice us more than they do. Stay in your own lane."
    },
  ],
  "patience": [
    { 
      negative: "I need to force something here", 
      reframe: "Good golf happens one shot at a time. Trust the process.",
      explanation: "Forcing leads to tension and poor decisions. Play within yourself and let results come."
    },
    { 
      negative: "My game should be better by now", 
      reframe: "Improvement isn't linear. Every round teaches me something.",
      explanation: "Golf has peaks and valleys. Embrace where you are while working toward where you want to be."
    },
    { 
      negative: "I can't wait for this round to be over", 
      reframe: "This moment on the course is a gift. Be here fully.",
      explanation: "When you wish you were somewhere else, you miss the opportunity to enjoy the present."
    },
  ],
  "decision-making": [
    { 
      negative: "I don't know what club to hit", 
      reframe: "Trust my instinct. Pick a clear target and commit fully.",
      explanation: "Indecision creates tension. Make a choice, commit to it, and accept the outcome."
    },
    { 
      negative: "I should have played differently", 
      reframe: "I made the best decision with the information I had. Move forward.",
      explanation: "Second-guessing past decisions wastes mental energy. Learn and move on."
    },
    { 
      negative: "What's the right play here", 
      reframe: "There's no perfect answer. Choose a play that fits my game and commit.",
      explanation: "The best play is one you can execute confidently. Your commitment matters more than the 'perfect' choice."
    },
  ],
  "self-talk": [
    { 
      negative: "I'm an idiot", 
      reframe: "I'm human. One shot doesn't define me or my round.",
      explanation: "Harsh self-criticism undermines performance. Speak to yourself with the same kindness you'd show a friend."
    },
    { 
      negative: "I always choke under pressure", 
      reframe: "I'm learning to perform under pressure. Each opportunity makes me stronger.",
      explanation: "Labeling yourself creates limiting beliefs. Focus on growth rather than fixed traits."
    },
    { 
      negative: "I suck at golf", 
      reframe: "I'm on a journey of improvement. Today's struggles are tomorrow's lessons.",
      explanation: "One round or even one season doesn't define your ability. Stay committed to the long game."
    },
  ],
  "pressure": [
    { 
      negative: "This shot is too important", 
      reframe: "It's just another shot. Same routine, same process.",
      explanation: "Every shot counts the same on the scorecard. Treat them all with equal focus and commitment."
    },
    { 
      negative: "I can't handle this moment", 
      reframe: "I've prepared for moments like this. I'm ready to perform.",
      explanation: "Pressure is a privilege - it means you're in a position that matters. Rise to the occasion."
    },
    { 
      negative: "Don't mess up, don't mess up", 
      reframe: "See my target, trust my swing, let it go.",
      explanation: "Negative commands focus on what you don't want. Redirect attention to positive targets."
    },
  ],
  "expectations": [
    { 
      negative: "I should be scoring better", 
      reframe: "Expectations create pressure. Focus on playing each shot well.",
      explanation: "Let go of score expectations and focus on process goals like commitment and routine."
    },
    { 
      negative: "I'm supposed to be good at this", 
      reframe: "I'm on my own journey. Comparison steals joy from the game.",
      explanation: "Your only competition is who you were yesterday. Celebrate your own progress."
    },
    { 
      negative: "This isn't the round I expected", 
      reframe: "I accept what is and play the shots in front of me.",
      explanation: "Fighting against reality wastes energy. Adapt to circumstances and play your best from here."
    },
  ],
  "acceptance": [
    { 
      negative: "This round is ruined", 
      reframe: "I can still enjoy this moment and learn from this experience.",
      explanation: "A challenging round is still time on the course. Find something to appreciate."
    },
    { 
      negative: "I can't accept this result", 
      reframe: "Acceptance doesn't mean approval. It means I can move forward freely.",
      explanation: "Accepting what happened allows you to respond effectively rather than react emotionally."
    },
    { 
      negative: "Why did that have to happen", 
      reframe: "It happened. Now, what's my best response?",
      explanation: "Questioning misfortune keeps you stuck. Accepting it opens the door to your next move."
    },
  ],
};

const practiceTips: Record<ThoughtCategory, { negative: string; reframe: string; explanation: string }[]> = {
  "confidence": [
    { 
      negative: "I'll never get better at this", 
      reframe: "Every repetition builds skill. Trust the process of improvement.",
      explanation: "Skill development is invisible until it suddenly shows up. Keep putting in the work."
    },
    { 
      negative: "I'm wasting my time practicing", 
      reframe: "Deliberate practice is the path to mastery. I'm investing in my future game.",
      explanation: "Practice is never wasted when it's intentional. Focus on quality over quantity."
    },
  ],
  "focus": [
    { 
      negative: "I'm just going through the motions", 
      reframe: "Stop. Set a clear intention for the next 10 shots. Quality over quantity.",
      explanation: "Mindless repetition doesn't improve skills. Practice with purpose and presence."
    },
    { 
      negative: "My mind keeps wandering", 
      reframe: "Bring attention back to one specific feel or target. Narrow the focus.",
      explanation: "When focus drifts, return to a single point of attention. Simplify your focus cues."
    },
  ],
  "frustration": [
    { 
      negative: "Why isn't this working", 
      reframe: "Struggle is part of learning. What small adjustment can I try?",
      explanation: "Frustration often signals you're on the edge of a breakthrough. Stay curious."
    },
    { 
      negative: "I keep making the same mistake", 
      reframe: "Awareness is the first step. Now I can experiment with solutions.",
      explanation: "Recognizing a pattern is progress. Use that awareness to try new approaches."
    },
  ],
  "anxiety": [
    { 
      negative: "I'm anxious about my game", 
      reframe: "Practice is the safe space to experiment. No score, no pressure.",
      explanation: "Use practice time to build confidence through repetition and experimentation."
    },
    { 
      negative: "What if I'm practicing wrong", 
      reframe: "There's no perfect way. Stay curious and keep learning.",
      explanation: "Any focused practice is valuable. Adjust your approach as you learn more."
    },
  ],
  "patience": [
    { 
      negative: "I want results now", 
      reframe: "Skill develops over time. Today's work will show up in future rounds.",
      explanation: "Trust that the deposits you make in practice will pay dividends on the course."
    },
    { 
      negative: "This is taking too long", 
      reframe: "Embrace the journey. Enjoy the process of becoming better.",
      explanation: "If you only enjoy destinations, you'll miss most of the experience. Find joy in the work."
    },
  ],
  "decision-making": [
    { 
      negative: "I don't know what to practice", 
      reframe: "Start with what challenged me in my last round. Work backwards.",
      explanation: "Let your on-course experience guide your practice priorities."
    },
    { 
      negative: "Should I change my technique", 
      reframe: "Make one small change at a time. Test it thoroughly before moving on.",
      explanation: "Wholesale changes create confusion. Make incremental adjustments and give them time."
    },
  ],
  "self-talk": [
    { 
      negative: "I'm so bad at this", 
      reframe: "I'm learning. Every expert was once a beginner.",
      explanation: "Mastery is a journey, not a destination. Honor where you are in that journey."
    },
    { 
      negative: "Other people improve faster", 
      reframe: "I'm on my own path. Focus on my own progress.",
      explanation: "Comparison is the thief of joy. Your only benchmark is your previous self."
    },
  ],
  "pressure": [
    { 
      negative: "I need to perfect this before my round", 
      reframe: "Practice builds foundation. Trust that work will show up when needed.",
      explanation: "Perfection in practice isn't required for good performance. Build confidence, not perfection."
    },
    { 
      negative: "I have to fix everything", 
      reframe: "Focus on one thing at a time. Small improvements compound.",
      explanation: "Trying to fix everything at once fixes nothing. Prioritize and focus."
    },
  ],
  "expectations": [
    { 
      negative: "I should be better by now", 
      reframe: "Skill development isn't linear. Keep showing up.",
      explanation: "Progress comes in waves. Trust the process during the plateaus."
    },
    { 
      negative: "This practice isn't productive", 
      reframe: "Any time spent with a club in hand builds feel and connection.",
      explanation: "Even 'unproductive' sessions maintain your relationship with the game."
    },
  ],
  "acceptance": [
    { 
      negative: "Today's practice was a waste", 
      reframe: "Even challenging sessions teach us something. What did I learn?",
      explanation: "Reframe difficult practice days as learning opportunities in disguise."
    },
    { 
      negative: "I can't accept where my game is", 
      reframe: "Acceptance allows me to work from where I am, not where I wish I was.",
      explanation: "Fighting your current reality prevents effective improvement. Start from truth."
    },
  ],
};

export default function Tips() {
  const [selectedCategory, setSelectedCategory] = useState<ThoughtCategory | null>(null);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Lightbulb className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-tips-title">Tips Library</h1>
          <p className="text-muted-foreground">
            Reframe negative thoughts into productive mindsets
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select a Thought Category</CardTitle>
          <CardDescription>
            Choose a mental aspect to see relevant reframing tips
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {thoughtCategories.map((cat) => (
              <Badge
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                className="cursor-pointer capitalize px-3 py-1.5"
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                data-testid={`badge-category-${cat}`}
              >
                {cat.replace("-", " ")}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedCategory && (
        <Tabs defaultValue="play" className="space-y-4">
          <TabsList>
            <TabsTrigger value="play" data-testid="tab-play-tips">
              <Flag className="w-4 h-4 mr-2" />
              During Rounds
            </TabsTrigger>
            <TabsTrigger value="practice" data-testid="tab-practice-tips">
              <Target className="w-4 h-4 mr-2" />
              During Practice
            </TabsTrigger>
          </TabsList>

          <TabsContent value="play" className="space-y-4">
            {playTips[selectedCategory]?.map((tip, i) => (
              <Card key={i} data-testid={`card-play-tip-${i}`}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                      <span className="text-destructive font-semibold text-sm">-</span>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Negative Thought</div>
                      <p className="italic">"{tip.negative}"</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Reframe</div>
                      <p className="font-medium text-primary">"{tip.reframe}"</p>
                    </div>
                  </div>
                  
                  <div className="pl-11 pt-2 border-t">
                    <p className="text-sm text-muted-foreground">{tip.explanation}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="practice" className="space-y-4">
            {practiceTips[selectedCategory]?.map((tip, i) => (
              <Card key={i} data-testid={`card-practice-tip-${i}`}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                      <span className="text-destructive font-semibold text-sm">-</span>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Negative Thought</div>
                      <p className="italic">"{tip.negative}"</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Reframe</div>
                      <p className="font-medium text-primary">"{tip.reframe}"</p>
                    </div>
                  </div>
                  
                  <div className="pl-11 pt-2 border-t">
                    <p className="text-sm text-muted-foreground">{tip.explanation}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}

      {!selectedCategory && (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Select a thought category above to see reframing tips</p>
          </div>
        </Card>
      )}
    </div>
  );
}
