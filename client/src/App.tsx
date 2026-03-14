import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import mindshotLogo from "@assets/mindshot_logo.png";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import PlayJournal from "@/pages/play-journal";
import PracticeJournal from "@/pages/practice-journal";
import History from "@/pages/history";
import SessionDetail from "@/pages/session-detail";
import Patterns from "@/pages/patterns";
import Tips from "@/pages/tips";
import StonkGolf from "@/pages/stonk-golf";
import Subscribe from "@/pages/subscribe";
import Landing from "@/pages/landing";
import AccountDeleted from "@/pages/account-deleted";

function AuthenticatedRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/play" component={PlayJournal} />
      <Route path="/practice" component={PracticeJournal} />
      <Route path="/history" component={History} />
      <Route path="/session/:id" component={SessionDetail} />
      <Route path="/patterns" component={Patterns} />
      <Route path="/tips" component={Tips} />
      <Route path="/pro-training" component={StonkGolf} />
      <Route path="/subscribe" component={Subscribe} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-2 p-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            <AuthenticatedRouter />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-accent/20">
      <div className="flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden animate-pulse">
          <img src={mindshotLogo} alt="MindShot" className="w-16 h-16 object-contain" />
        </div>
        <span className="text-lg font-semibold text-foreground">MindShot</span>
        <div className="flex gap-1.5 mt-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { isLoading, isAuthenticated } = useAuth();

  // Always show this page regardless of auth state
  if (window.location.pathname === "/account-deleted") {
    return <AccountDeleted />;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
