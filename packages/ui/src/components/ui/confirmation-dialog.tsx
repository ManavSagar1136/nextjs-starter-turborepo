/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo, useState } from "react";
import { DialogProps } from "@radix-ui/react-dialog";
import { AlertTriangle, LucideIcon, Star, RefreshCw } from "lucide-react";
import { Button, ButtonProps } from "./button";
import { cn } from "../../lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./dialog";

/**
 * Variants available for the {@link ConfirmationDialog}.
 */
export const CONFIRMATION_DIALOG_VARIANTS = {
  DELETE: "delete",
  PRIMARY: "primary",
} as const;

declare global {
  /**
   * Type representing allowed dialog variants.
   */
  type IConfirmationDialogVariant = (typeof CONFIRMATION_DIALOG_VARIANTS)[keyof typeof CONFIRMATION_DIALOG_VARIANTS];

  /**
   * Props for the {@link ConfirmationDialog} component.
   */
  interface IConfirmationDialogProps extends DialogProps {
    title?: string;
    description?: string;
    variant?: IConfirmationDialogVariant;
    entity?: string;
    actionPayload?: unknown;
    itemName?: string;
    showToast?: boolean;
    confirmButtonProps?: ButtonProps & {
      onAction?: (payload: any) => Promise<{ success: boolean; message?: string }>;
    };
    cancelButtonProps?: ButtonProps;
    onSuccess?: (result?: { success: boolean; message?: string }) => void;
    onError?: (error?: any) => void;
  }
}

/**
 * Returns the icon configuration for the confirmation dialog
 * based on the selected variant.
 */
const getVariantIcon = (
  variant?: IConfirmationDialogVariant
): {
  icon: React.ReactElement<LucideIcon>;
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
  variant: IConfirmationDialogVariant;
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
          variant: "destructive",
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
          variant: "default",
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
const ConfirmationDialog: React.FC<IConfirmationDialogProps> = ({
  variant = CONFIRMATION_DIALOG_VARIANTS.PRIMARY,
  title,
  description,
  entity,
  itemName,
  confirmButtonProps: { onAction, ...confirmButtonProps } = {},
  cancelButtonProps,
  actionPayload,
  showToast = false,
  onSuccess,
  onError,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const config = useMemo(
    () => renderConfirmationDialogConfig({ variant, entity, itemName, isLoading }),
    [entity, variant, itemName, isLoading]
  );

  const iconConfig = useMemo(() => getVariantIcon(variant), [variant]);

  /**
   * Closes the confirmation dialog and restores pointer events.
   */
  const handleCloseDialog = () => {
    if (isLoading) return;
    props?.onOpenChange?.(false);
    setIsLoading(false);
  };

  /**
   * Handles the confirmation action.
   * Executes the provided action, shows toast feedback, and closes the dialog.
   */
  const handleConfirmation = (e: any) => {
    setIsLoading(true);
    const actionText = variant;

    if (onAction) {
      return onAction?.(actionPayload as typeof actionPayload)
        .then(res => {
          if (showToast && typeof window !== "undefined") {
            // Use sonner or similar toast library if available
            console.log(res?.message || `${actionText} operation performed successfully`);
          }
          onSuccess?.(res);
          handleCloseDialog();
        })
        .catch(error => {
          if (showToast && typeof window !== "undefined") {
            console.error(`Failed to perform ${actionText} operation`);
          }
          onError?.(error);
          setIsLoading(false);
        });
    } else {
      if (showToast && typeof window !== "undefined") {
        console.log(`${actionText} Operation performed successfully`);
      }
      onSuccess?.();
      handleCloseDialog();
    }

    confirmButtonProps?.onClick?.(e);
  };

  return (
    <Dialog {...props}>
      <DialogContent className={cn("rounded-xl p-6 sm:max-w-lg")}>
        <DialogHeader className="space-y-4">
          {/* Icon */}
          {iconConfig && (
            <div
              className={cn("mx-auto flex items-center justify-center rounded-full p-5 shadow-sm", iconConfig.bgColor)}
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
            {isLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
            {config.confirmButton.children}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmationDialog;
