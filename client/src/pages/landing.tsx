import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Capacitor } from "@capacitor/core";
import { useLocation } from "wouter";
import {
  BookOpen,
  TrendingUp,
  Target,
  Sparkles,
  LogIn,
  CheckCircle,
} from "lucide-react";
import mindshotLogo from "@assets/mindshot_logo.png";

export default function Landing() {
  const API_BASE = "https://mindshotgolf.com";
  const [, setLocation] = useLocation();

  function handleGetStarted() {
    if (Capacitor.isNativePlatform()) {
      setLocation("/subscribe");
      return;
    }

    window.location.href = `${API_BASE}/api/login`;
  }

  function handleSignIn() {
    if (Capacitor.isNativePlatform()) {
      setLocation("/dashboard");
      return;
    }

    window.location.href = `${API_BASE}/api/login`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/20">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 pt-14 pb-2 flex items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
              <img
                src={mindshotLogo}
                alt="MindShot"
                className="w-8 h-8 object-contain"
              />
            </div>
            <span className="text-xl font-bold">MindShot</span>
          </div>
        </div>
      </nav>

      <main className="pt-28">
        <section className="max-w-6xl mx-auto px-4 py-20 text-center">
          <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden mx-auto mb-8">
            <img
              src={mindshotLogo}
              alt="MindShot"
              className="w-20 h-20 object-contain"
              data-testid="img-hero-logo"
            />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 font-serif">
            Master Your Mental Game
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Journal your rounds and practice sessions to uncover patterns in your
            thinking, build mental resilience, and play your best golf.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Button
              size="lg"
              className="w-full sm:w-auto text-base px-8 py-6"
              data-testid="button-get-started"
              onClick={handleGetStarted}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Get Started Free
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto text-base px-8 py-6"
              data-testid="button-sign-in-hero"
              onClick={handleSignIn}
            >
              <LogIn className="w-5 h-5 mr-2" />
              Sign In
            </Button>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              4 free journal entries
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              No credit card required
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
                  Structured reflection questions help you capture the thoughts
                  and emotions that impact your performance on the course.
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
                  Discover recurring mental tendencies across confidence, focus,
                  frustration, and 7 other key dimensions of your mental game.
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
                  Get personalized reframing suggestions to transform negative
                  thought patterns into constructive mental approaches.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-center mb-8">Simple Pricing</h2>
          <p className="text-center text-muted-foreground mb-8">
            Start with 4 free journal entries. Upgrade when you&apos;re ready for
            unlimited access.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Card className="hover-elevate">
              <CardContent className="py-8 text-center space-y-4">
                <h3 className="font-semibold text-lg">Monthly</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold">$9.99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground text-left max-w-xs mx-auto">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    Unlimited journal entries
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    Full pattern analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    Cancel anytime
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-primary/50 hover-elevate relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-medium">
                  Best Value
                </span>
              </div>
              <CardContent className="py-8 text-center space-y-4">
                <h3 className="font-semibold text-lg">Yearly</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold">$89.99</span>
                  <span className="text-muted-foreground">/year</span>
                </div>
                <p className="text-sm text-primary font-medium">
                  Save $30 — just $7.50/month
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground text-left max-w-xs mx-auto">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    Unlimited journal entries
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    Full pattern analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    2 months free
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <footer className="border-t py-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} MindShot Golf. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}