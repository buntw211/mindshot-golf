import { Ban } from "lucide-react";
import mindshotLogo from "@assets/mindshot_logo.png";

export default function AccountDeleted() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/20 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden mx-auto">
          <img src={mindshotLogo} alt="MindShot" className="w-16 h-16 object-contain" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-destructive">
            <Ban className="w-5 h-5" />
            <h1 className="text-2xl font-bold">Account Deleted</h1>
          </div>
          <p className="text-muted-foreground">
            This account has been permanently deleted and can no longer be used to sign in.
          </p>
          <p className="text-sm text-muted-foreground">
            If you'd like to use MindShot again, you'll need to sign in with a different account.
          </p>
        </div>
      </div>
    </div>
  );
}
