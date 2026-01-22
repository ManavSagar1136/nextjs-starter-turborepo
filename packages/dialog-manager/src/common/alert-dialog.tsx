"use client";

import React from "react";
import { AlertCircle, Info, CheckCircle2, XCircle } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@buildbase/ui/dialog";
import { Button } from "@buildbase/ui/button";
import { cn } from "@buildbase/ui/lib/utils";
import type { DialogOrSheetBaseProps } from "../base-props";

/**
 * Variants available for the AlertDialog.
 */
export const ALERT_DIALOG_VARIANTS = {
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning",
  ERROR: "error",
} as const;

export type AlertDialogVariant = (typeof ALERT_DIALOG_VARIANTS)[keyof typeof ALERT_DIALOG_VARIANTS];

/**
 * Props for the AlertDialog component.
 * Extends DialogOrSheetBaseProps to ensure compatibility with dialog manager.
 */
export interface AlertDialogProps extends DialogOrSheetBaseProps {
  title?: string;
  description?: string;
  variant?: AlertDialogVariant;
  onConfirm?: () => void;
  confirmLabel?: string;
  showCancel?: boolean;
  cancelLabel?: string;
}

/**
 * Returns the icon configuration for the alert dialog
 * based on the selected variant.
 */
const getVariantIcon = (
  variant: AlertDialogVariant = ALERT_DIALOG_VARIANTS.INFO
): {
  icon: React.ReactElement;
  bgColor: string;
  iconColor: string;
} => {
  switch (variant) {
    case ALERT_DIALOG_VARIANTS.SUCCESS:
      return {
        icon: <CheckCircle2 className="h-6 w-6" />,
        bgColor: "bg-green-500/10",
        iconColor: "text-green-600 dark:text-green-400",
      };
    case ALERT_DIALOG_VARIANTS.WARNING:
      return {
        icon: <AlertCircle className="h-6 w-6" />,
        bgColor: "bg-yellow-500/10",
        iconColor: "text-yellow-600 dark:text-yellow-400",
      };
    case ALERT_DIALOG_VARIANTS.ERROR:
      return {
        icon: <XCircle className="h-6 w-6" />,
        bgColor: "bg-destructive/10",
        iconColor: "text-destructive",
      };
    case ALERT_DIALOG_VARIANTS.INFO:
    default:
      return {
        icon: <Info className="h-6 w-6" />,
        bgColor: "bg-blue-500/10",
        iconColor: "text-blue-600 dark:text-blue-400",
      };
  }
};

/**
 * A reusable alert dialog component.
 *
 * Used for displaying informational messages, warnings, errors, or success messages.
 */
export const AlertDialog: React.FC<AlertDialogProps> = ({
  variant = ALERT_DIALOG_VARIANTS.INFO,
  title,
  description,
  onConfirm,
  confirmLabel = "OK",
  showCancel = false,
  cancelLabel = "Cancel",
  ...props
}) => {
  const iconConfig = getVariantIcon(variant);

  const handleConfirm = () => {
    onConfirm?.();
    props?.onOpenChange?.(false);
  };

  const handleCancel = () => {
    props?.onOpenChange?.(false);
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent
        className={cn("rounded-xl p-6 sm:max-w-lg")}
        onInteractOutside={e => {
          // Prevent closing on outside click for alert dialogs
          e.preventDefault();
        }}
      >
        <DialogHeader className="space-y-4">
          {/* Icon */}
          <div
            className={cn(
              "svg-12 mx-auto flex items-center justify-center rounded-full p-5 shadow-sm",
              iconConfig.bgColor
            )}
          >
            <div className={cn(iconConfig.iconColor)}>{iconConfig.icon}</div>
          </div>

          {/* Title */}
          {title && <DialogTitle className="text-center text-xl font-semibold tracking-tight">{title}</DialogTitle>}

          {/* Description */}
          {description && (
            <DialogDescription className="text-muted-foreground text-center text-sm leading-relaxed">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Footer */}
        <DialogFooter className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {showCancel && (
            <Button variant="outline" className="w-full rounded-lg border-2 sm:w-auto" onClick={handleCancel}>
              {cancelLabel}
            </Button>
          )}
          <Button
            variant="default"
            className={cn("w-full rounded-lg font-medium shadow-sm sm:w-auto", showCancel && "sm:flex-1")}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
