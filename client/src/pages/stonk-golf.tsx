import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Users, Dumbbell, Target, ArrowRight, CheckCircle2, ExternalLink } from "lucide-react";

export default function StonkGolf() {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Users className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-stonk-title">Live Professional Training</h1>
          <p className="text-muted-foreground">
            Take your mental game to the next level with expert guidance
          </p>
        </div>
      </div>

      <Card className="border-primary/20">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Target className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl">Stonk Golf</CardTitle>
              <CardDescription className="text-base">Mental Golf Training Facility</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground leading-relaxed">
            Stonk Golf is a premier mental golf training facility dedicated to helping golfers of all levels 
            unlock their full potential. Their team combines cutting-edge sports psychology with personalized 
            training programs to transform how you think, feel, and perform on the course.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bg-accent/30 border border-accent rounded-md p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1" data-testid="text-psychologists-title">Sports Psychologists</h3>
                  <p className="text-sm text-muted-foreground" data-testid="text-psychologists-desc">
                    Work with certified sports psychologists who specialize in golf performance. 
                    They'll help you build mental resilience, manage pressure, and develop winning mindsets.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-accent/30 border border-accent rounded-md p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Dumbbell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1" data-testid="text-trainers-title">Personal Trainers</h3>
                  <p className="text-sm text-muted-foreground" data-testid="text-trainers-desc">
                    Golf-specific fitness training designed to improve your physical game. 
                    Build strength, flexibility, and endurance that translates directly to better golf.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">What You'll Get</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                One-on-one sessions with mental performance coaches
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                Personalized mental game strategies tailored to your needs
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                Pre-round routines and on-course mental techniques
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                Golf-specific fitness and conditioning programs
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                Ongoing support and progress tracking
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <Badge variant="secondary" className="mb-2" data-testid="badge-partner">Partner Program</Badge>
                <p className="text-sm text-muted-foreground">
                  Ready to work with a professional? Visit Stonk Golf to learn more about their programs.
                </p>
              </div>
              <a 
                href="https://stonkgolf.com" 
                target="_blank" 
                rel="noopener noreferrer"
                data-testid="link-visit-stonk"
              >
                <Button size="lg" className="shrink-0">
                  Visit Stonk Golf
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Complement Your Journey</h3>
              <p className="text-sm text-muted-foreground">
                Use MindShot to track your mental game progress between sessions with Stonk Golf. 
                Your journal entries and pattern insights can help your coach understand your challenges 
                and tailor their approach to your specific needs.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
