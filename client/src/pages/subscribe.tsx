import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Crown, Sparkles, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import mindshotLogo from "@assets/mindshot_logo.png";

interface SubscriptionInfo {
  subscriptionStatus: string;
  subscriptionTier: string | null;
  sessionCount: number;
  freeEntriesRemaining: number;
  isSubscribed: boolean;
}

export default function Subscribe() {
  const { toast } = useToast();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
  }, []);

  const { data: subInfo, isLoading } = useQuery<SubscriptionInfo>({
    queryKey: ["/api/subscription"],
  });

  const checkoutMutation = useMutation({
    mutationFn: async (plan: "monthly" | "yearly") => {
      const res = await apiRequest("POST", "/api/checkout", { plan });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    },
  });

  const manageMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/manage-subscription", {});
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isSubscribed = subInfo?.isSubscribed;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden mx-auto">
          <img src={mindshotLogo} alt="MindShot" className="w-12 h-12 object-contain" />
        </div>
        <h1 className="text-3xl font-bold" data-testid="text-subscribe-title">
          {isSubscribed ? "Your Subscription" : "Upgrade to MindShot Pro"}
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          {isSubscribed
            ? "You have unlimited access to all features."
            : "Unlock unlimited journal entries and take your mental game to the next level."}
        </p>
      </div>

      {!isSubscribed && subInfo && (
        <div className="text-center">
          <Badge variant="secondary" className="text-sm px-4 py-1" data-testid="badge-free-remaining">
            {subInfo.freeEntriesRemaining > 0
              ? `${subInfo.freeEntriesRemaining} free ${subInfo.freeEntriesRemaining === 1 ? 'entry' : 'entries'} remaining`
              : "Free entries used — subscribe to continue"}
          </Badge>
        </div>
      )}

      {isSubscribed ? (
        <Card className="max-w-md mx-auto border-primary/30">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-primary" />
              <CardTitle>MindShot Pro</CardTitle>
            </div>
            <CardDescription>
              {subInfo?.subscriptionTier === "yearly" ? "Yearly Plan" : "Monthly Plan"} — Active
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              {subInfo?.sessionCount} journal entries created
            </p>
            <Button
              variant="outline"
              onClick={() => manageMutation.mutate()}
              disabled={manageMutation.isPending}
              data-testid="button-manage-subscription"
            >
              {manageMutation.isPending ? "Loading..." : "Manage Subscription"}
            </Button>
            <div>
              <button
                onClick={() => manageMutation.mutate()}
                disabled={manageMutation.isPending}
                data-testid="button-cancel-subscription"
                className="text-sm text-muted-foreground underline underline-offset-4 hover:text-destructive transition-colors disabled:opacity-50"
              >
                Cancel Subscription
              </button>
            </div>
          </CardContent>
        </Card>
      ) : (
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
                className="w-full"
                onClick={() => checkoutMutation.mutate("monthly")}
                disabled={checkoutMutation.isPending}
                data-testid="button-checkout-monthly"
              >
                {checkoutMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Subscribe Monthly
              </Button>
            </CardContent>
          </Card>

          <Card className="relative border-primary/50 hover-elevate">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground" data-testid="badge-best-value">
                Best Value — Save $30
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-lg">Yearly</CardTitle>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">$89.99</span>
                <span className="text-muted-foreground">/year</span>
              </div>
              <p className="text-sm text-muted-foreground">That's just $7.50/month</p>
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
                className="w-full"
                onClick={() => checkoutMutation.mutate("yearly")}
                disabled={checkoutMutation.isPending}
                data-testid="button-checkout-yearly"
              >
                {checkoutMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Crown className="w-4 h-4 mr-2" />
                )}
                Subscribe Yearly
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="text-center text-xs text-muted-foreground space-y-1">
        <p>Payments are processed securely through Stripe.</p>
        <p>You can cancel your subscription at any time.</p>
      </div>
    </div>
  );
}
