import { Ban, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import mindshotLogo from "@assets/mindshot_logo.png";

export default function AccountDeleted() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/20 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden mx-auto">
          <img src={mindshotLogo} alt="MindShot" className="w-16 h-16 object-contain" />
        </div>

        {isAuthenticated ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 text-primary" />
                <h1 className="text-2xl font-bold">Fresh Start</h1>
              </div>
              <p className="text-muted-foreground">
                Your previous account was deleted. You've been signed in with a brand new, empty account.
              </p>
              <p className="text-sm text-muted-foreground">
                All previous journal entries and history are gone. You're starting completely fresh.
              </p>
            </div>
            <Button asChild className="w-full">
              <a href="/">Go to Dashboard</a>
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Ban className="w-5 h-5" />
                <h1 className="text-2xl font-bold">Account Deleted</h1>
              </div>
              <p className="text-muted-foreground">
                Your account and all journal entries have been permanently deleted.
              </p>
              <p className="text-sm text-muted-foreground">
                You can sign back in at any time to start fresh with a new account.
              </p>
            </div>
            <Button asChild className="w-full">
              <a href="/api/login">Sign In Again</a>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
