import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  BookOpen, 
  TrendingUp, 
  Target, 
  Sparkles,
  LogIn,
  CheckCircle
} from "lucide-react";
import mindshotLogo from "@assets/mindshot_logo.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/20">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
              <img src={mindshotLogo} alt="MindShot" className="w-8 h-8 object-contain" data-testid="img-landing-logo" />
            </div>
            <span className="text-xl font-bold">MindShot</span>
          </div>
          <Button data-testid="button-login" asChild>
            <a href="/api/login">
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </a>
          </Button>
        </div>
      </nav>

      <main className="pt-24">
        <section className="max-w-6xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 font-serif">
            Master Your Mental Game
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Journal your rounds and practice sessions to uncover patterns in your thinking, 
            build mental resilience, and play your best golf.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" className="w-full sm:w-auto" data-testid="button-get-started" asChild>
              <a href="/api/login">
                <Sparkles className="w-5 h-5 mr-2" />
                Get Started Free
              </a>
            </Button>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Unlimited journal entries
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Free to use
            </span>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-center mb-12">Why MindShot?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover-elevate">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Guided Journaling</h3>
                <p className="text-muted-foreground">
                  Structured reflection questions help you capture the thoughts and emotions 
                  that impact your performance on the course.
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover-elevate">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Pattern Analysis</h3>
                <p className="text-muted-foreground">
                  Discover recurring mental tendencies across confidence, focus, frustration, 
                  and 7 other key dimensions of your mental game.
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover-elevate">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Mental Game Tips</h3>
                <p className="text-muted-foreground">
                  Get personalized reframing suggestions to transform negative thought patterns 
                  into constructive mental approaches.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 py-16">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Start Journaling Today</h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Sign up for free and start tracking your mental game right away.
                All features are included at no cost.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground max-w-xs mx-auto text-left">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Unlimited journal entries
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Pattern analysis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Self-assessment comparison
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Tips library access
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <footer className="border-t py-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} MindShot Golf. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}
