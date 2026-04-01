import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  purchase,
  restorePurchases,
  preloadOfferings,
  purchasesReady,
} from "@/lib/purchases";
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
import { CheckCircle, Loader2, Trash2 } from "lucide-react";
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
  const [purchaseLoading, setPurchaseLoading] = useState<"monthly" | "yearly" | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [iapReady, setIapReady] = useState(false);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
  }, []);

  useEffect(() => {
    let mounted = true;

    async function warmUpPurchases() {
      try {
        const ready = await preloadOfferings();
        if (mounted) {
          setIapReady(ready || purchasesReady());
        }
      } catch (error) {
        console.error("Failed to preload offerings:", error);
        if (mounted) {
          setIapReady(false);
        }
      }
    }

    warmUpPurchases();

    return () => {
      mounted = false;
    };
  }, []);

  const { data: subInfo, isLoading } = useQuery<SubscriptionInfo>({
    queryKey: ["/api/subscription"],
  });

  const handleSubscribe = async (plan: "monthly" | "yearly") => {
  try {
    setPurchaseLoading(plan);

    if (!iapReady) {
      await preloadOfferings();
      setIapReady(true);
    }

    const result = await purchase(plan);

    if (result.success) {
      toast({
        title: "Subscription Active",
        description:
          plan === "monthly"
            ? "Monthly subscription activated."
            : "Yearly subscription activated.",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
      return;
    }

    toast({
      title: "Purchase Failed",
      description: result.error ?? "Unable to complete purchase.",
      variant: "destructive",
    });
  } finally {
    setPurchaseLoading(null);
  }
};

  const handleRestorePurchases = async () => {
    try {
      setRestoreLoading(true);

      const result = await restorePurchases();

      if (result.success) {
        toast({
          title: "Purchases Restored",
          description: "Your subscription has been restored.",
        });

        queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
        return;
      }

      toast({
        title: "Restore Failed",
        description: result.error ?? "Unable to restore purchases.",
        variant: "destructive",
      });
    } finally {
      setRestoreLoading(false);
    }
  };

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
          <img
            src={mindshotLogo}
            alt="MindShot"
            className="w-12 h-12 object-contain"
          />
        </div>

        <h1 className="text-3xl font-bold" data-testid="text-subscribe-title">
          MindShot Pro
        </h1>

        <p className="text-muted-foreground max-w-lg mx-auto">
          Upgrade for unlimited journal entries, full pattern analysis, and
          deeper self-assessment tools.
        </p>

        {subInfo && !subInfo.isSubscribed && subInfo.freeEntriesRemaining != null && (
          <p className="text-sm text-muted-foreground">
            You have{" "}
            <span className="font-medium text-foreground">
              {subInfo.freeEntriesRemaining}
            </span>{" "}
            free entries remaining.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <Card className="relative hover-elevate">
          <CardHeader>
            <CardTitle className="text-lg">Monthly</CardTitle>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">$9.99</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
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
                Cancel anytime
              </li>
            </ul>

            <Button
  className="w-full text-base px-8 py-6"
  onClick={() => handleSubscribe("monthly")}
  disabled={purchaseLoading !== null || restoreLoading}
>
  {purchaseLoading === "monthly" ? (
    <>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      Starting Monthly...
    </>
  ) : (
    "Start Monthly"
  )}
</Button>
          </CardContent>
        </Card>

        <Card className="relative border-primary/50 hover-elevate">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge
              className="bg-primary text-primary-foreground"
              data-testid="badge-best-value"
            >
              Best Value — Save $20
            </Badge>
          </div>

          <CardHeader>
            <CardTitle className="text-lg">Yearly</CardTitle>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">$99.99</span>
              <span className="text-muted-foreground">/year</span>
            </div>
            <p className="text-sm text-muted-foreground">
              That&apos;s just $8.33/month
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
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
                2 months free
              </li>
            </ul>

           <Button
  className="w-full text-base px-8 py-6"
  onClick={() => handleSubscribe("yearly")}
  disabled={purchaseLoading !== null || restoreLoading}
>
  {purchaseLoading === "yearly" ? (
    <>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      Starting Yearly...
    </>
  ) : (
    "Start Yearly"
  )}
</Button>
          </CardContent>
        </Card>
      </div>

      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <button
  onClick={handleRestorePurchases}
  disabled={restoreLoading || purchaseLoading !== null}
  className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors disabled:opacity-50"
>
  {restoreLoading ? "Restoring..." : "Restore Purchases"}
</button>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Subscriptions auto-renew unless canceled at least 24 hours before the
          end of the current period. Payment will be charged to your Apple ID
          account at confirmation of purchase.
        </p>
      </div>

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
              <span className="block font-medium text-foreground mt-2">
                This cannot be undone.
              </span>
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