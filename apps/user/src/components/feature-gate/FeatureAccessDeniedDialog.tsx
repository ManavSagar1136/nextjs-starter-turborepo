"use client";

import React from "react";
import { Lock, Zap, Crown } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@buildbase/ui/dialog";
import { Button } from "@buildbase/ui/button";
import { Badge } from "@buildbase/ui/badge";
import { cn } from "@buildbase/ui/lib/utils";
import type { DialogOrSheetBaseProps } from "@buildbase/dialog-manager";

export const FEATURE_DENIAL_REASONS = {
  NOT_INCLUDED: "not-included",
  EXHAUSTED: "exhausted",
  NOT_PERMITTED: "not-permitted",
} as const;

export type FeatureDenialReason = (typeof FEATURE_DENIAL_REASONS)[keyof typeof FEATURE_DENIAL_REASONS];

export interface FeatureAccessDeniedDialogProps extends DialogOrSheetBaseProps {
  featureName?: string;
  reason?: FeatureDenialReason;
  title?: string;
  description?: string;
  upgradeLabel?: string;
  onUpgrade?: () => void;
  cancelLabel?: string;
}

const getReasonConfig = (
  reason: FeatureDenialReason = FEATURE_DENIAL_REASONS.NOT_INCLUDED,
  featureName = "this feature"
) => {
  switch (reason) {
    case FEATURE_DENIAL_REASONS.EXHAUSTED:
      return {
        icon: <Zap className="h-6 w-6" />,
        bgColor: "bg-orange-500/10",
        iconColor: "text-orange-500",
        badgeLabel: "Quota Reached",
        badgeVariant: "destructive" as const,
        title: `${featureName} quota reached`,
        description: `You've used all available ${featureName} for this billing period. Upgrade your plan to increase your quota or wait until your period resets.`,
      };
    case FEATURE_DENIAL_REASONS.NOT_PERMITTED:
      return {
        icon: <Lock className="h-6 w-6" />,
        bgColor: "bg-muted",
        iconColor: "text-muted-foreground",
        badgeLabel: "Permission Required",
        badgeVariant: "secondary" as const,
        title: "Permission required",
        description: `You don't have permission to use ${featureName}. Contact your workspace admin to request access.`,
      };
    case FEATURE_DENIAL_REASONS.NOT_INCLUDED:
    default:
      return {
        icon: <Crown className="h-6 w-6" />,
        bgColor: "bg-primary/10",
        iconColor: "text-primary",
        badgeLabel: "Plan Upgrade Required",
        badgeVariant: "default" as const,
        title: `Upgrade to use ${featureName}`,
        description: `${featureName} is not included in your current plan. Upgrade to unlock this feature and get access to more tools that help you scale.`,
      };
  }
};

/**
 * Dialog shown when a user attempts to use a feature they don't have access to.
 *
 * Opened via the dialog manager with key `FEATURE_GATE_DIALOG_KEYS.ACCESS_DENIED`.
 *
 * @example
 * const { openDialog } = useDialogManager();
 * openDialog(FEATURE_GATE_DIALOG_KEYS.ACCESS_DENIED, {
 *   featureName: "API Access",
 *   reason: FEATURE_DENIAL_REASONS.NOT_INCLUDED,
 *   onUpgrade: () => router.push("/settings/billing"),
 * });
 */
export const FeatureAccessDeniedDialog: React.FC<FeatureAccessDeniedDialogProps> = ({
  featureName = "this feature",
  reason = FEATURE_DENIAL_REASONS.NOT_INCLUDED,
  title,
  description,
  upgradeLabel = "Upgrade Plan",
  onUpgrade,
  cancelLabel = "Maybe Later",
  ...props
}) => {
  const config = getReasonConfig(reason, featureName);
  const isPermissionDenied = reason === FEATURE_DENIAL_REASONS.NOT_PERMITTED;

  const handleUpgrade = () => {
    onUpgrade?.();
    props.onOpenChange?.(false);
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className={cn("rounded-xl p-6 sm:max-w-md")}>
        <DialogHeader className="space-y-4">
          <div
            className={cn("svg-12 mx-auto flex items-center justify-center rounded-full p-5 shadow-sm", config.bgColor)}
          >
            <div className={cn(config.iconColor)}>{config.icon}</div>
          </div>

          <div className="flex justify-center">
            <Badge variant={config.badgeVariant} className="text-xs font-medium">
              {config.badgeLabel}
            </Badge>
          </div>

          <DialogTitle className="text-center text-xl font-semibold tracking-tight">
            {title || config.title}
          </DialogTitle>

          <DialogDescription className="text-muted-foreground text-center text-sm leading-relaxed">
            {description || config.description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            className="w-full rounded-lg border-2 sm:w-auto"
            onClick={() => props.onOpenChange?.(false)}
          >
            {cancelLabel}
          </Button>

          {!isPermissionDenied && (
            <Button
              variant="default"
              className="w-full rounded-lg font-medium shadow-sm sm:w-auto sm:flex-1"
              onClick={handleUpgrade}
            >
              {upgradeLabel}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
