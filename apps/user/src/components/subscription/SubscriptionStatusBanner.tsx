"use client";

import React from "react";
import { AlertTriangle, Clock, CreditCard, XCircle, X } from "lucide-react";
import {
  useSubscriptionContext,
  useSaaSWorkspaces,
  useBillingPortal,
  WhenTrialEnding,
  WhenTrialing,
} from "@buildbase/saas-sdk";
import { Button } from "@buildbase/ui/button";
import { cn } from "@buildbase/ui/lib/utils";

interface BannerProps {
  icon: React.ReactNode;
  message: React.ReactNode;
  action?: { label: string; onClick: () => void; loading?: boolean };
  variant: "warning" | "error" | "info";
  onDismiss?: () => void;
}

function Banner({ icon, message, action, variant, onDismiss }: BannerProps) {
  const styles = {
    warning:
      "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200",
    error: "bg-red-50 border-red-200 text-red-900 dark:bg-red-950/40 dark:border-red-800 dark:text-red-200",
    info: "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-200",
  };

  return (
    <div className={cn("flex items-center justify-between gap-3 border-b px-4 py-2 text-sm", styles[variant])}>
      <div className="flex items-center gap-2">
        <span className="shrink-0">{icon}</span>
        <span>{message}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {action && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 rounded-md border-current bg-transparent px-2 text-xs hover:bg-white/20"
            onClick={action.onClick}
            disabled={action.loading}
          >
            {action.loading ? "Opening…" : action.label}
          </Button>
        )}
        {onDismiss && (
          <button onClick={onDismiss} className="rounded p-0.5 opacity-60 hover:opacity-100">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Renders contextual subscription/trial status banners at the top of the dashboard.
 *
 * Banners shown (highest priority first — only one shown at a time):
 * 1. Past due → billing action required
 * 2. Canceled (still active until period end) → reactivation prompt
 * 3. Trial ending ≤ 3 days → urgent upgrade
 * 4. Trialing → informational with days remaining
 *
 * Must be rendered inside SubscriptionContextProvider (already in AppProviders).
 */
export function SubscriptionStatusBanner() {
  const [dismissed, setDismissed] = React.useState<string | null>(null);
  const { response } = useSubscriptionContext();
  const { currentWorkspace } = useSaaSWorkspaces();
  const { openBillingPortal, loading: portalLoading } = useBillingPortal(currentWorkspace?._id ?? null);

  const subscription = response?.subscription;
  if (!subscription) return null;

  const status = subscription.subscriptionStatus;
  const isPastDue = status === "past_due" || status === "unpaid";
  const isCanceled = status === "canceled" || (status === "active" && subscription.cancelAtPeriodEnd);

  const handleBillingPortal = () => openBillingPortal(window.location.href);

  // Past due — highest priority, not dismissible
  if (isPastDue && dismissed !== "past_due") {
    return (
      <Banner
        variant="error"
        icon={<CreditCard className="h-4 w-4" />}
        message={
          <>
            <strong>Payment failed.</strong> Update your payment method to keep access to your workspace.
          </>
        }
        action={{ label: "Update Payment", onClick: handleBillingPortal, loading: portalLoading }}
      />
    );
  }

  // Cancellation scheduled — active subscription set to cancel at period end
  if (isCanceled && subscription.cancelAtPeriodEnd && dismissed !== "canceled") {
    const endDate = subscription.stripeCurrentPeriodEnd
      ? new Date(subscription.stripeCurrentPeriodEnd).toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : "end of period";

    return (
      <Banner
        variant="warning"
        icon={<XCircle className="h-4 w-4" />}
        message={
          <>
            Your subscription is cancelled and access ends on <strong>{endDate}</strong>. Reactivate to keep your data.
          </>
        }
        action={{ label: "Reactivate", onClick: handleBillingPortal, loading: portalLoading }}
        onDismiss={() => setDismissed("canceled")}
      />
    );
  }

  // Trial ending ≤ 3 days — urgent (uses SDK component as wrapper for the check)
  return (
    <>
      <WhenTrialEnding
        daysThreshold={3}
        fallbackComponent={
          // Trial (>3 days remaining) — informational
          <WhenTrialing fallbackComponent={null}>
            <TrialInfoBanner
              dismissed={dismissed}
              onDismiss={setDismissed}
              onPortal={handleBillingPortal}
              portalLoading={portalLoading}
            />
          </WhenTrialing>
        }
      >
        <TrialEndingBanner
          dismissed={dismissed}
          onDismiss={setDismissed}
          onPortal={handleBillingPortal}
          portalLoading={portalLoading}
        />
      </WhenTrialEnding>
    </>
  );
}

function TrialEndingBanner({
  dismissed,
  onDismiss,
  onPortal,
  portalLoading,
}: {
  dismissed: string | null;
  onDismiss: (key: string) => void;
  onPortal: () => void;
  portalLoading: boolean;
}) {
  if (dismissed === "trial-ending") return null;
  return (
    <Banner
      variant="warning"
      icon={<AlertTriangle className="h-4 w-4" />}
      message={
        <>
          <strong>Your trial ends soon.</strong> Add a payment method now to avoid losing access.
        </>
      }
      action={{ label: "Upgrade Now", onClick: onPortal, loading: portalLoading }}
      onDismiss={() => onDismiss("trial-ending")}
    />
  );
}

function TrialInfoBanner({
  dismissed,
  onDismiss,
  onPortal,
  portalLoading,
}: {
  dismissed: string | null;
  onDismiss: (key: string) => void;
  onPortal: () => void;
  portalLoading: boolean;
}) {
  if (dismissed === "trial") return null;
  return (
    <Banner
      variant="info"
      icon={<Clock className="h-4 w-4" />}
      message="You're on a free trial. Upgrade any time to unlock full access."
      action={{ label: "View Plans", onClick: onPortal, loading: portalLoading }}
      onDismiss={() => onDismiss("trial")}
    />
  );
}
