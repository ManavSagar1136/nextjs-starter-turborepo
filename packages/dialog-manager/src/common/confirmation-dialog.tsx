"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, LucideIcon, Star } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@buildbase/ui/dialog";
import { Button, type ButtonProps } from "@buildbase/ui/button";
import { cn } from "@buildbase/ui/lib/utils";
import type { DialogOrSheetBaseProps } from "../base-props";

/**
 * Variants available for the ConfirmationDialog.
 */
export const CONFIRMATION_DIALOG_VARIANTS = {
  DELETE: "delete",
  PRIMARY: "primary",
} as const;

export type ConfirmationDialogVariant =
  (typeof CONFIRMATION_DIALOG_VARIANTS)[keyof typeof CONFIRMATION_DIALOG_VARIANTS];

/**
 * Props for the ConfirmationDialog component.
 * Extends DialogOrSheetBaseProps to ensure compatibility with dialog manager.
 */
export interface ConfirmationDialogProps extends DialogOrSheetBaseProps {
  title?: string;
  description?: string;
  variant?: ConfirmationDialogVariant;
  entity?: string;
  actionPayload?: unknown;
  itemName?: string;
  showToast?: boolean;
  confirmButtonProps?: ButtonProps & {
    onAction?: (payload: any) => Promise<{ success: boolean; message?: string }>;
  };
  cancelButtonProps?: ButtonProps;
}

/**
 * Returns the icon configuration for the confirmation dialog
 * based on the selected variant.
 */
const getVariantIcon = (
  variant?: ConfirmationDialogVariant
): {
  icon: React.ReactElement;
  bgColor: string;
  iconColor: string;
} | null => {
  switch (variant) {
    case CONFIRMATION_DIALOG_VARIANTS.DELETE:
      return {
        icon: <AlertTriangle className="h-6 w-6" />,
        bgColor: "bg-destructive/10",
        iconColor: "text-destructive",
      };
    case CONFIRMATION_DIALOG_VARIANTS.PRIMARY:
      return {
        icon: <Star className="h-6 w-6" />,
        bgColor: "bg-primary/10",
        iconColor: "text-primary",
      };
    default:
      return null;
  }
};

/**
 * Returns the title and description for the confirmation dialog
 * based on the selected variant and entity name.
 */
const renderConfirmationDialogConfig = ({
  variant,
  entity = "item",
  isLoading,
  itemName,
}: {
  variant: ConfirmationDialogVariant;
  entity: string | undefined;
  isLoading: boolean;
  itemName: string | undefined;
}) => {
  switch (variant) {
    case CONFIRMATION_DIALOG_VARIANTS.DELETE:
      return {
        title: `Delete ${entity}?`,
        description: (
          <>
            Are you sure you want to permanently delete{" "}
            {itemName ? <span className="font-semibold">&quot;{itemName}&quot;</span> : null} {entity}? This action
            cannot be undone and all related data will be lost.
          </>
        ),
        confirmButton: {
          children: isLoading ? "Deleting..." : "Delete",
          variant: "destructive" as const,
        } as ButtonProps,
      };
    case CONFIRMATION_DIALOG_VARIANTS.PRIMARY:
    default:
      return {
        title: `Set ${entity} as Primary?`,
        description: (
          <>
            Setting {itemName ? <span className="font-semibold">&quot;{itemName}&quot;</span> : null} {entity} as your
            primary choice will make it the default selection for future actions. You can change this at any time, but
            are you sure you want to proceed?
          </>
        ),
        confirmButton: {
          children: isLoading ? "Setting as Primary..." : "Set as Primary",
          variant: "default" as const,
        } as ButtonProps,
      };
  }
};

/**
 * A reusable confirmation dialog component.
 *
 * Supports async confirmation actions and optional toast messages
 * for success or failure feedback.
 */
export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  variant = CONFIRMATION_DIALOG_VARIANTS.PRIMARY,
  title,
  description,
  entity,
  itemName,
  confirmButtonProps: { onAction, ...confirmButtonProps } = {},
  cancelButtonProps,
  actionPayload,
  showToast = false,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const config = useMemo(
    () => renderConfirmationDialogConfig({ variant, entity, itemName, isLoading }),
    [entity, variant, itemName, isLoading]
  );

  const iconConfig = useMemo(() => getVariantIcon(variant), [variant]);

  /**
   * Closes the confirmation dialog.
   */
  const handleCloseDialog = () => {
    if (isLoading) return;
    props?.onOpenChange?.(false);
    setIsLoading(false);
  };

  /**
   * Handles the confirmation action.
   */
  const handleConfirmation = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsLoading(true);
    const actionText = variant;

    if (onAction) {
      return onAction?.(actionPayload as typeof actionPayload)
        .then(res => {
          if (showToast && typeof window !== "undefined") {
            // Note: Toast implementation should be provided by the app
            // For now, we'll use console or let the app handle it
            if (res.success) {
              console.log(res?.message || `${actionText} operation performed successfully`);
            } else {
              console.error(res?.message || `Failed to perform ${actionText} operation`);
            }
          }
          handleCloseDialog();
        })
        .catch(() => {
          if (showToast && typeof window !== "undefined") {
            console.error(`Failed to perform ${actionText} operation`);
          }
          setIsLoading(false);
        });
    } else {
      if (showToast && typeof window !== "undefined") {
        console.log(`${actionText} Operation performed successfully`);
      }
      handleCloseDialog();
    }

    confirmButtonProps?.onClick?.(e);
  };

  return (
    <Dialog {...props}>
      <DialogContent
        className={cn("rounded-xl p-6 sm:max-w-lg")}
        onInteractOutside={e => {
          if (isLoading) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={e => {
          if (isLoading) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader className="space-y-4">
          {/* Icon */}
          {iconConfig && (
            <div
              className={cn(
                "svg-12 mx-auto flex items-center justify-center rounded-full p-5 shadow-sm",
                iconConfig.bgColor
              )}
            >
              <div className={cn(iconConfig.iconColor)}>{iconConfig.icon}</div>
            </div>
          )}

          {/* Title */}
          <DialogTitle className="text-center text-xl font-semibold tracking-tight">
            {title || config.title}
          </DialogTitle>

          {/* Description */}
          <DialogDescription className="text-muted-foreground text-center text-sm leading-relaxed">
            {description || config.description}
          </DialogDescription>
        </DialogHeader>

        {/* Footer */}
        <DialogFooter className="mt-6 flex flex-col-reverse gap-3 *:flex-1 sm:flex-row sm:justify-end">
          <Button
            {...cancelButtonProps}
            variant="outline"
            disabled={isLoading}
            className={cn("w-full rounded-lg border-2 sm:w-auto", cancelButtonProps?.className)}
            onClick={e => {
              handleCloseDialog();
              cancelButtonProps?.onClick?.(e);
            }}
          >
            {cancelButtonProps?.children || "Cancel"}
          </Button>

          <Button
            {...config.confirmButton}
            {...confirmButtonProps}
            disabled={isLoading}
            className={cn("w-full rounded-lg font-medium shadow-sm sm:w-auto", confirmButtonProps?.className)}
            onClick={handleConfirmation}
          >
            {config.confirmButton.children}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
