import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle, Crown, Loader2, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import mindshotLogo from "@assets/mindshot_logo.png";

interface SubscriptionInfo {
  subscriptionStatus: string;
  subscriptionTier: string | null;
  sessionCount: number;
  freeEntriesRemaining: number | null;
  isSubscribed: boolean;
}

export default function Subscribe() {
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
  }, []);

  const { data: subInfo, isLoading } = useQuery<SubscriptionInfo>({
    queryKey: ["/api/subscription"],
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/account");
      return res.json();
    },
    onSuccess: (data) => {
      window.location.href = data.logoutUrl ?? "/api/logout";
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden mx-auto">
          <img src={mindshotLogo} alt="MindShot" className="w-12 h-12 object-contain" />
        </div>
        <h1 className="text-3xl font-bold" data-testid="text-subscribe-title">
          MindShot Pro
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          All features are currently free to use. In-app subscriptions are coming soon.
        </p>
      </div>

      <Card className="max-w-md mx-auto border-primary/20">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Crown className="w-5 h-5 text-primary" />
            <CardTitle>What's included</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-2 text-sm">
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
              Self-assessment comparisons
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
              AI-powered mental game insights
            </li>
          </ul>
          {subInfo && (
            <p className="text-xs text-muted-foreground text-center pt-2 border-t">
              {subInfo.sessionCount} journal {subInfo.sessionCount === 1 ? "entry" : "entries"} created
            </p>
          )}
        </CardContent>
      </Card>

      <div className="border-t pt-8 max-w-md mx-auto space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide text-center">
          Danger Zone
        </h3>
        <p className="text-sm text-muted-foreground text-center">
          Permanently delete your account and all journal entries.
        </p>
        <div className="flex justify-center">
          <button
            onClick={() => setShowDeleteDialog(true)}
            data-testid="button-delete-account"
            className="text-sm text-destructive underline underline-offset-4 hover:text-destructive/80 transition-colors"
          >
            Delete my account
          </button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Delete Account?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">This will permanently delete:</span>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>All your journal entries and insights</li>
                <li>Your pattern history and ratings</li>
                <li>Your account and profile</li>
              </ul>
              <span className="block font-medium text-foreground mt-2">This cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAccountMutation.isPending}>
              Keep My Account
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAccountMutation.mutate()}
              disabled={deleteAccountMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-account"
            >
              {deleteAccountMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Yes, Delete Everything"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
