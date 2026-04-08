import { useEffect, useState } from "react";
import { Switch, Route, useLocation } from "wouter";
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
import Login from "@/pages/login";
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

type AuthUser = {
  id: string | number;
  email: string;
  verified?: boolean;
};

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

function ProtectedRoute({
  children,
  user,
  authChecked,
}: {
  children: React.ReactNode;
  user: AuthUser | null;
  authChecked: boolean;
}) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (authChecked && !user) {
      setLocation("/login");
    }
  }, [authChecked, user, setLocation]);

  if (!authChecked) {
    return <LoadingScreen />;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

function AppRouter({
  user,
  authChecked,
}: {
  user: AuthUser | null;
  authChecked: boolean;
}) {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />

      <Route path="/subscribe">
        <Subscribe />
      </Route>

      <Route path="/dashboard">
        <ProtectedRoute user={user} authChecked={authChecked}>
          <AppShell>
            <Dashboard />
          </AppShell>
        </ProtectedRoute>
      </Route>

      <Route path="/play">
        <ProtectedRoute user={user} authChecked={authChecked}>
          <AppShell>
            <PlayJournal />
          </AppShell>
        </ProtectedRoute>
      </Route>

      <Route path="/practice">
        <ProtectedRoute user={user} authChecked={authChecked}>
          <AppShell>
            <PracticeJournal />
          </AppShell>
        </ProtectedRoute>
      </Route>

      <Route path="/history">
        <ProtectedRoute user={user} authChecked={authChecked}>
          <AppShell>
            <History />
          </AppShell>
        </ProtectedRoute>
      </Route>

      <Route path="/session/:id">
        {(params) => (
          <ProtectedRoute user={user} authChecked={authChecked}>
            <AppShell>
              <SessionDetail id={params.id} />
            </AppShell>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/patterns">
        <ProtectedRoute user={user} authChecked={authChecked}>
          <AppShell>
            <Patterns />
          </AppShell>
        </ProtectedRoute>
      </Route>

      <Route path="/tips">
        <ProtectedRoute user={user} authChecked={authChecked}>
          <AppShell>
            <Tips />
          </AppShell>
        </ProtectedRoute>
      </Route>

      <Route path="/pro-training">
        <ProtectedRoute user={user} authChecked={authChecked}>
          <AppShell>
            <StonkGolf />
          </AppShell>
        </ProtectedRoute>
      </Route>

      <Route component={Landing} />
    </Switch>
  );
}

function AppContent() {
  const [booting, setBooting] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function boot() {
      const API_BASE =
        import.meta.env.VITE_API_BASE_URL ||
        "https://mindshot-golf-production.up.railway.app";

      try {
        await SplashScreen.show({
          autoHide: false,
        });

        try {
          await initPurchases();
        } catch (error) {
          console.error("initPurchases failed:", error);
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        try {
          const res = await fetch(`${API_BASE}/api/auth/me`, {
            credentials: "include",
            signal: controller.signal,
          });

          if (res.ok) {
            const userData = await res.json();
            if (isMounted) {
              setUser(userData);
            }
          } else {
            if (isMounted) {
              setUser(null);
            }
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          if (isMounted) {
            setUser(null);
          }
        } finally {
          clearTimeout(timeout);
          if (isMounted) {
            setAuthChecked(true);
          }
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

  return <AppRouter user={user} authChecked={authChecked} />;
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