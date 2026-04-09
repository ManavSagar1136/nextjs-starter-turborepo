"use client";

import React from "react";
import { Crown, Zap, Lock, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button, type ButtonProps } from "@buildbase/ui/button";
import { useAppDialogManager } from "../../hooks/useAppDialogManager";
import { useFeatureGate, FEATURE_STATES } from "@buildbase/saas-sdk";
import type { UseFeatureGateOptions } from "@buildbase/saas-sdk";

import { FEATURE_DENIAL_REASONS } from "./FeatureAccessDeniedDialog";
import type { FeatureDenialReason } from "./FeatureAccessDeniedDialog";
import { FEATURE_GATE_DIALOG_KEYS } from "./constants";

export interface FeatureButtonProps extends Omit<ButtonProps, "onClick">, UseFeatureGateOptions {
  /** Feature slug checked against the subscription plan. */
  featureSlug: string;
  /** Human-readable name shown in the access-denied dialog. */
  featureName?: string;
  /** Called when the user clicks and access is allowed. */
  onExecute?: () => void;
  /** Path to navigate to for upgrading. Defaults to "/settings/billing". */
  upgradePath?: string;
  /** Override the dialog description. */
  denialDescription?: string;
}

/**
 * A button that enforces feature gate checks before executing an action.
 *
 * - Allowed → calls `onExecute`.
 * - Not included → Crown icon + opens FeatureAccessDeniedDialog.
 * - Quota exhausted → Zap icon + opens FeatureAccessDeniedDialog.
 * - Not permitted → Lock icon, button disabled (no dialog).
 * - Loading → spinner, button disabled.
 *
 * @example
 * <FeatureButton featureSlug="api-access" featureName="API Access" onExecute={handleCreate}>
 *   Create API Key
 * </FeatureButton>
 */
export function FeatureButton({
  featureSlug,
  featureName,
  onExecute,
  upgradePath = "/settings/billing",
  denialDescription,
  children,
  quotaSlug,
  hasPermission,
  ...buttonProps
}: FeatureButtonProps) {
  const router = useRouter();
  const { openDialog } = useAppDialogManager();
  const { state } = useFeatureGate(featureSlug, { quotaSlug, hasPermission });

  const isLoading = state === FEATURE_STATES.LOADING;
  const isNotPermitted = state === FEATURE_STATES.NOT_PERMITTED;
  const isDenied = state === FEATURE_STATES.NOT_INCLUDED || state === FEATURE_STATES.EXHAUSTED;

  const handleClick = () => {
    if (isLoading || isNotPermitted) return;

    if (isDenied) {
      const reason: FeatureDenialReason =
        state === FEATURE_STATES.EXHAUSTED ? FEATURE_DENIAL_REASONS.EXHAUSTED : FEATURE_DENIAL_REASONS.NOT_INCLUDED;

      openDialog(FEATURE_GATE_DIALOG_KEYS.ACCESS_DENIED, {
        featureName: featureName ?? featureSlug,
        reason,
        description: denialDescription,
        onUpgrade: () => router.push(upgradePath),
      });
      return;
    }

    onExecute?.();
  };

  const indicator = getIndicator(state);

  return (
    <Button
      {...buttonProps}
      disabled={isLoading || isNotPermitted || buttonProps.disabled}
      title={indicator?.tooltip}
      onClick={handleClick}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : indicator ? (
        <indicator.Icon className={`mr-2 h-4 w-4 ${indicator.className}`} />
      ) : null}
      {children}
    </Button>
  );
}

interface Indicator {
  Icon: React.ElementType;
  className: string;
  tooltip: string;
}

function getIndicator(state: string): Indicator | null {
  switch (state) {
    case FEATURE_STATES.NOT_INCLUDED:
      return { Icon: Crown, className: "text-primary", tooltip: "Upgrade your plan to unlock this feature" };
    case FEATURE_STATES.EXHAUSTED:
      return { Icon: Zap, className: "text-orange-500", tooltip: "You've reached your quota for this feature" };
    case FEATURE_STATES.NOT_PERMITTED:
      return {
        Icon: Lock,
        className: "text-muted-foreground",
        tooltip: "You don't have permission to use this feature",
      };
    default:
      return null;
  }
}
