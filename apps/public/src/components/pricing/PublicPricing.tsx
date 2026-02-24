"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { env } from "@buildbase/env";
import { usePublicPlans } from "@buildbase/saas-sdk";
import { Button } from "@buildbase/ui/button";
import { Badge } from "@buildbase/ui/components/ui/badge";
import { cn } from "@buildbase/ui/lib/utils";

import { useGetStarted } from "@/hooks/use-get-started";

type BillingCycle = "monthly" | "annual";

/**
 * PublicPricing
 *
 * Renders pricing plans fetched live from the Buildbase backend via usePublicPlans.
 * Falls back to a friendly error state if plans can't be loaded.
 *
 * Usage: must be wrapped in <PublicPricingProvider> (provides SaaSOSProvider context).
 */
export function PublicPricing() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const { onGetStartedClick, isLoadingCta } = useGetStarted();

  const { plans, loading, error } = usePublicPlans(env.NEXT_PUBLIC_PLAN_GROUP_SLUG ?? "");
  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
      </div>
    );
  }

  if (error || !plans?.length) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-muted-foreground text-sm">
          Pricing is not available right now. Please try again in a few minutes.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Billing toggle */}
      <BillingToggle value={billingCycle} onChange={setBillingCycle} />

      {/* Plan cards */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan: any) => (
          <PlanCard
            key={plan._id || plan.id}
            plan={plan}
            billingCycle={billingCycle}
            onGetStarted={onGetStartedClick}
            isLoading={isLoadingCta}
          />
        ))}
      </div>

      <p className="text-muted-foreground mt-8 text-center text-sm">
        All plans include a 14-day free trial. No credit card required.
      </p>
    </div>
  );
}

// ─── Billing Toggle ──────────────────────────────────────────────────────────

function BillingToggle({
  value,
  onChange,
}: {
  value: BillingCycle;
  onChange: (v: BillingCycle) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-3">
      <button
        onClick={() => onChange("monthly")}
        className={cn(
          "text-sm font-medium transition-colors",
          value === "monthly" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        Monthly
      </button>
      <button
        onClick={() => onChange(value === "monthly" ? "annual" : "monthly")}
        className="bg-muted relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
        role="switch"
        aria-checked={value === "annual"}
      >
        <span
          className={cn(
            "bg-background inline-block size-4 rounded-full shadow-sm transition-transform",
            value === "annual" ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
      <button
        onClick={() => onChange("annual")}
        className={cn(
          "flex items-center gap-1.5 text-sm font-medium transition-colors",
          value === "annual" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        Annual
        <Badge variant="secondary" className="text-xs">Save 20%</Badge>
      </button>
    </div>
  );
}

// ─── Plan Card ───────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  billingCycle,
  onGetStarted,
  isLoading,
}: {
  plan: any;
  billingCycle: BillingCycle;
  onGetStarted: () => void;
  isLoading: boolean;
}) {
  const isPopular = plan.isPopular || plan.recommended;
  const price = billingCycle === "annual"
    ? (plan.annualPrice ?? plan.price)
    : (plan.monthlyPrice ?? plan.price);
  const features: string[] = plan.features || plan.featureList || [];

  return (
    <div
      className={cn(
        "border-border/50 bg-card relative flex flex-col rounded-2xl border p-6 shadow-sm transition-shadow hover:shadow-md",
        isPopular && "border-primary ring-primary/20 ring-2"
      )}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-3 py-0.5 text-xs font-semibold">
            Most Popular
          </Badge>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold">{plan.name}</h3>
        {plan.description && (
          <p className="text-muted-foreground mt-1 text-sm">{plan.description}</p>
        )}
      </div>

      <div className="mb-6">
        {typeof price === "number" ? (
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold">${price}</span>
            <span className="text-muted-foreground text-sm">
              /{billingCycle === "annual" ? "yr" : "mo"}
            </span>
          </div>
        ) : (
          <span className="text-3xl font-extrabold">{price ?? "Free"}</span>
        )}
        {billingCycle === "annual" && typeof plan.monthlyPrice === "number" && (
          <p className="text-muted-foreground mt-1 text-xs">
            ${(plan.annualPrice / 12).toFixed(0)}/mo billed annually
          </p>
        )}
      </div>

      <Button
        variant={isPopular ? "brand" : "outline"}
        className="mb-6 w-full"
        onClick={onGetStarted}
        disabled={isLoading}
      >
        {plan.isFree ? "Get Started Free" : "Start Free Trial"}
      </Button>

      {features.length > 0 && (
        <ul className="flex-1 space-y-2.5">
          {features.map((feature: string, i: number) => (
            <li key={i} className="flex items-start gap-2.5 text-sm">
              <Check className="text-primary mt-0.5 size-4 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
