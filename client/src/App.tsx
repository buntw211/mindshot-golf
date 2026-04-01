import { useEffect, useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import mindshotLogo from "@assets/mindshot_logo.png";
import { SplashScreen } from "@capacitor/splash-screen";
import { initPurchases } from "@/lib/purchases";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import PlayJournal from "@/pages/play-journal";
import PracticeJournal from "@/pages/practice-journal";
import History from "@/pages/history";
import SessionDetail from "@/pages/session-detail";
import Patterns from "@/pages/patterns";
import Tips from "@/pages/tips";
import StonkGolf from "@/pages/stonk-golf";
import Subscribe from "@/pages/subscribe";
import AccountDeleted from "@/pages/account-deleted";

function AppShell({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={style}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b pt-[env(safe-area-inset-top)] px-2 pb-2 flex items-center justify-between gap-2">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>

          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function LoadingScreen() {
  return (
    <div
      className="bg-gradient-to-b from-background to-accent/20"
      style={{
        height: "100dvh",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div
        className="flex h-full items-center justify-center"
        style={{ paddingTop: "40px" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden animate-pulse">
            <img
              src={mindshotLogo}
              alt="MindShot"
              className="w-16 h-16 object-contain"
            />
          </div>

          <span className="text-lg font-semibold text-foreground">MindShot</span>

          <div className="flex gap-1.5 mt-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/subscribe">
  <AppShell>
    <Subscribe />
  </AppShell>
</Route>
      <Route path="/dashboard">
        <AppShell>
          <Dashboard />
        </AppShell>
      </Route>
      <Route path="/play">
        <AppShell>
          <PlayJournal />
        </AppShell>
      </Route>
      <Route path="/practice">
        <AppShell>
          <PracticeJournal />
        </AppShell>
      </Route>
      <Route path="/history">
        <AppShell>
          <History />
        </AppShell>
      </Route>
      <Route path="/session/:id">
        {(params) => (
          <AppShell>
            <SessionDetail id={params.id} />
          </AppShell>
        )}
      </Route>
      <Route path="/patterns">
        <AppShell>
          <Patterns />
        </AppShell>
      </Route>
      <Route path="/tips">
        <AppShell>
          <Tips />
        </AppShell>
      </Route>
      <Route path="/pro-training">
        <AppShell>
          <StonkGolf />
        </AppShell>
      </Route>
      <Route component={Landing} />
    </Switch>
  );
}

function AppContent() {
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function boot() {
      try {
        await SplashScreen.show({
          autoHide: false,
        });

        try {
          await initPurchases();
        } catch (error) {
          console.error("initPurchases failed:", error);
        }

        await new Promise((resolve) => setTimeout(resolve, 800));
      } catch (error) {
        console.error("Boot failed:", error);
      } finally {
        if (isMounted) {
          setBooting(false);
        }

        try {
          await SplashScreen.hide();
        } catch (error) {
          console.error("SplashScreen hide failed:", error);
        }
      }
    }

    boot();

    return () => {
      isMounted = false;
    };
  }, []);

  if (window.location.pathname === "/account-deleted") {
    return <AccountDeleted />;
  }

  if (booting) {
    return <LoadingScreen />;
  }

  return <AppRouter />;
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