import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PricingModal({ open, onOpenChange }: PricingModalProps) {
  const [selectedInterval, setSelectedInterval] = useState<"month" | "year">("month");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ interval: selectedInterval }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create checkout session");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const features = [
    "Unlimited journal entries",
    "Advanced pattern analysis",
    "Self-assessment comparison insights",
    "Full tips library access",
    "Priority support",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            Upgrade to Premium
          </DialogTitle>
          <DialogDescription>
            Choose your subscription plan
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <Card
            className={`cursor-pointer transition-all ${
              selectedInterval === "month"
                ? "border-primary ring-2 ring-primary/20"
                : "hover-elevate"
            }`}
            onClick={() => setSelectedInterval("month")}
            data-testid="card-monthly"
          >
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">$9.99</p>
              <p className="text-sm text-muted-foreground">per month</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all relative ${
              selectedInterval === "year"
                ? "border-primary ring-2 ring-primary/20"
                : "hover-elevate"
            }`}
            onClick={() => setSelectedInterval("year")}
            data-testid="card-yearly"
          >
            <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs" variant="default">
              Save 25%
            </Badge>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">$89.99</p>
              <p className="text-sm text-muted-foreground">per year</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium">What's included:</p>
          <ul className="space-y-2">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button
          className="w-full mt-4"
          onClick={handleCheckout}
          disabled={isLoading}
          data-testid="button-checkout"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Crown className="w-4 h-4 mr-2" />
              Subscribe {selectedInterval === "month" ? "Monthly" : "Yearly"}
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
