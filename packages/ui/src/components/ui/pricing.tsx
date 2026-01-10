import * as React from "react";
import { Check, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface PricingFeature {
  name: string;
  included: boolean;
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: PricingFeature[];
  popular?: boolean;
  cta: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export interface PricingProps {
  plans: PricingPlan[];
  billingPeriod: "monthly" | "yearly";
  onBillingPeriodChange?: (period: "monthly" | "yearly") => void;
  className?: string;
  showBillingToggle?: boolean;
}

export function Pricing({
  plans,
  billingPeriod,
  onBillingPeriodChange,
  className,
  showBillingToggle = true,
}: PricingProps) {
  return (
    <div className={cn("space-y-8", className)}>
      {/* Billing Toggle */}
      {showBillingToggle && (
        <div className="flex items-center justify-center">
          <div className="bg-muted flex items-center space-x-2 rounded-lg p-1">
            <button
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                billingPeriod === "monthly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => onBillingPeriodChange?.("monthly")}
            >
              Monthly
            </button>
            <button
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                billingPeriod === "yearly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => onBillingPeriodChange?.("yearly")}
            >
              Yearly
            </button>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {plans.map(plan => (
          <Card key={plan.id} className={cn("relative", plan.popular && "ring-primary ring-2")}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
              </div>
            )}

            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold">
                    ${billingPeriod === "yearly" ? plan.price.yearly : plan.price.monthly}
                  </span>
                  <span className="text-muted-foreground ml-1">/{billingPeriod === "yearly" ? "year" : "month"}</span>
                </div>
                {billingPeriod === "yearly" && (
                  <p className="text-muted-foreground mt-1 text-sm">
                    Save ${plan.price.monthly * 12 - plan.price.yearly} per year
                  </p>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                    ) : (
                      <X className="text-muted-foreground mt-0.5 h-5 w-5 flex-shrink-0" />
                    )}
                    <span className={cn("text-sm", !feature.included && "text-muted-foreground")}>{feature.name}</span>
                  </li>
                ))}
              </ul>

              <Button className="w-full" variant={plan.popular ? "default" : "outline"} asChild={!!plan.cta.href}>
                {plan.cta.href ? (
                  <a href={plan.cta.href}>{plan.cta.label}</a>
                ) : (
                  <button onClick={plan.cta.onClick}>{plan.cta.label}</button>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
