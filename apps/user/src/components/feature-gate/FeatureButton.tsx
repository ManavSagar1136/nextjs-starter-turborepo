"use client";

import React from "react";
import { Crown, Zap, Lock, Loader2 } from "lucide-react";

import { Button, type ButtonProps } from "@buildbase/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@buildbase/ui/popover";
import { useAppDialogManager } from "../../hooks/useAppDialogManager";
import { useFeatureGate, FEATURE_STATES } from "@buildbase/saas-sdk";
import type { UseFeatureGateOptions } from "@buildbase/saas-sdk";
import { useSDKAuth } from "../../hooks/useSDKAuth";

import { FEATURE_DENIAL_REASONS } from "./FeatureAccessDeniedDialog";
import type { FeatureDenialReason } from "./FeatureAccessDeniedDialog";
import { FEATURE_GATE_DIALOG_KEYS } from "./constants";

export interface FeatureButtonProps extends Omit<ButtonProps, "onClick">, UseFeatureGateOptions {
  /** Feature slug checked against the subscription plan. */
  featureSlug: string;
  /** Human-readable name shown in the access-denied dialog and popover. */
  featureName?: string;
  /** Called when the user clicks and access is allowed. */
  onExecute?: () => void;
  /** Override the dialog description. */
  denialDescription?: string;
}

/**
 * A button that enforces feature gate checks before executing an action.
 *
 * States:
 * - OK → calls `onExecute` on click, no indicator
 * - NOT_INCLUDED → Crown icon + popover + opens FeatureAccessDeniedDialog on click
 * - EXHAUSTED → Zap icon + popover + opens FeatureAccessDeniedDialog on click
 * - NOT_PERMITTED → Lock icon + popover, button disabled
 * - LOADING → spinner, button disabled
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
  denialDescription,
  children,
  quotaSlug,
  hasPermission,
  ...buttonProps
}: FeatureButtonProps) {
  const { openDialog } = useAppDialogManager();
  const { openSubscriptionSettings } = useSDKAuth();
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
        onUpgrade: openSubscriptionSettings,
      });
      return;
    }

    onExecute?.();
  };

  const indicator = getIndicator(state, featureName ?? featureSlug);

  const button = (
    <Button {...buttonProps} disabled={isLoading || isNotPermitted || buttonProps.disabled} onClick={handleClick}>
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : indicator ? (
        <indicator.Icon className={`mr-2 h-4 w-4 ${indicator.className}`} />
      ) : null}
      {children}
    </Button>
  );

  if (!indicator) return button;

  return (
    <Popover>
      <PopoverTrigger asChild>{button}</PopoverTrigger>
      <PopoverContent className="w-64 p-3" side="top" align="center">
        <div className="flex items-start gap-2">
          <indicator.Icon className={`mt-0.5 h-4 w-4 shrink-0 ${indicator.className}`} />
          <div>
            <p className="text-sm font-medium leading-none">{indicator.title}</p>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{indicator.description}</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface Indicator {
  Icon: React.ElementType;
  className: string;
  title: string;
  description: string;
}

function getIndicator(state: string, featureName: string): Indicator | null {
  switch (state) {
    case FEATURE_STATES.NOT_INCLUDED:
      return {
        Icon: Crown,
        className: "text-primary",
        title: "Upgrade required",
        description: `${featureName} is not included in your current plan. Upgrade to unlock this feature.`,
      };
    case FEATURE_STATES.EXHAUSTED:
      return {
        Icon: Zap,
        className: "text-orange-500",
        title: "Quota reached",
        description: `You've used all available ${featureName} for this billing period. Upgrade to increase your limit.`,
      };
    case FEATURE_STATES.NOT_PERMITTED:
      return {
        Icon: Lock,
        className: "text-muted-foreground",
        title: "Permission required",
        description: "You don't have permission to use this feature. Contact your workspace admin.",
      };
    default:
      return null;
  }
}
