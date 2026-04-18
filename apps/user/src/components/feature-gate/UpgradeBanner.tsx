"use client";

import { Lock } from "lucide-react";
import { Button } from "@buildbase/ui/components/ui/button";
import { useSDKAuth } from "@/hooks/useSDKAuth";

interface UpgradeBannerProps {
  featureName: string;
  description?: string;
}

/**
 * Compact inline upgrade prompt — use as `fallback` inside `FeatureGate`
 * when the gated content is a section (not a full page).
 */
export function UpgradeBanner({ featureName, description }: UpgradeBannerProps) {
  const { openSubscriptionSettings } = useSDKAuth();
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-violet-100 bg-violet-50 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100">
          <Lock className="h-4 w-4 text-violet-500" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-violet-900">{featureName} not included</p>
          {description && <p className="mt-0.5 truncate text-xs text-violet-600">{description}</p>}
        </div>
      </div>
      <Button
        size="sm"
        onClick={openSubscriptionSettings}
        className="shrink-0 bg-violet-600 text-white hover:bg-violet-700"
      >
        Upgrade
      </Button>
    </div>
  );
}
