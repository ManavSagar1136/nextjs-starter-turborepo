import React from "react";
import type { DialogOrSheetBaseProps, DialogOrSheetComponent } from "./base-props";
import { COMMON_DIALOG_KEYS } from "./config";

/**
 * Base type for dialog component map.
 * All components in the map must extend DialogOrSheetBaseProps to ensure
 * they have the required `open` and `onOpenChange` props.
 *
 * Apps extend this with their own dialog/sheet components.
 */
export type DialogComponentMap = Record<string, DialogOrSheetComponent<DialogOrSheetBaseProps>>;

/**
 * Common dialogs component map that includes email dialogs with their proper types.
 * This ensures type safety when using openDialog with email dialogs.
 *
 * Note: This type is defined here to avoid circular dependencies.
 * The actual components are imported where needed.
 */
export type CommonDialogComponentMap = DialogComponentMap & {
  [COMMON_DIALOG_KEYS.EMAIL_PROVIDER]: React.ComponentType<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: "create" | "edit";
    providerId?: string;
    initialData?: {
      name?: string;
      description?: string;
      type?: string;
      fromName?: string;
      fromEmail?: string;
      replyTo?: string;
      isDefault?: boolean;
      isActive?: boolean;
      config?: Record<string, unknown>;
    };
    onSuccess?: (provider: unknown) => void;
    onFetchProvider?: (id: string) => Promise<{
      name: string;
      description?: string;
      type: string;
      fromName: string;
      fromEmail: string;
      replyTo?: string;
      isDefault: boolean;
      isActive: boolean;
      config: Record<string, unknown>;
    }>;
    onSaveProvider: (data: any, mode: "create" | "edit", id?: string) => Promise<any>;
  }>;
  [COMMON_DIALOG_KEYS.EMAIL_TEMPLATE]: React.ComponentType<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: "create" | "edit";
    templateId?: string;
    initialData?: {
      slug?: string;
      name?: string;
      description?: string;
      subject?: string;
      html?: string;
      text?: string;
      category?: string;
      isActive?: boolean;
    };
    onSuccess?: (template: unknown) => void;
    onFetchTemplate?: (id: string) => Promise<{
      slug?: string;
      name: string;
      description?: string;
      subject: string;
      html: string;
      text?: string;
      category: string;
      isActive?: boolean;
    }>;
    onSaveTemplate: (data: any, mode: "create" | "edit", id?: string) => Promise<any>;
  }>;
};

/**
 * A helper type that, for each dialog key, returns the props of the matching
 * React component. This ensures **strongly-typed** props when opening a dialog
 * with `openDialog` – the compiler will now correctly infer the exact prop
 * requirements for the selected dialog.
 */
export type DialogPropsMap<T extends DialogComponentMap = DialogComponentMap> = {
  [K in keyof T]: React.ComponentProps<T[K]>;
};

/**
 * Type representing all possible dialog keys from a component map.
 */
export type DialogKey<T extends DialogComponentMap = DialogComponentMap> = keyof T & string;

/**
 * Options that can be passed when opening a dialog.
 * These are separate from the dialog component's props.
 */
export interface DialogOpenOptions {
  /**
   * Callback fired when the dialog closes.
   * This is called regardless of how the dialog was closed
   * (Escape key, outside click, programmatic close, etc.).
   */
  onClose?: () => void;

  /**
   * Callback fired when the dialog opens.
   */
  onOpen?: () => void;
}

/**
 * Interface for a dialog instance.
 */
export type DialogInstance<T extends DialogComponentMap = DialogComponentMap> = {
  id: string;
  key: DialogKey<T>;
  props: Omit<DialogPropsMap<T>[DialogKey<T>], "open" | "onOpenChange">;
  options?: DialogOpenOptions;
  createdAt: number;
};

/**
 * Interface for the dialog context, providing methods to open and close dialogs.
 */
export type DialogContextType<T extends DialogComponentMap = DialogComponentMap> = {
  openDialog: <K extends DialogKey<T>>(
    key: K,
    props: Omit<DialogPropsMap<T>[K], "open" | "onOpenChange">,
    options?: DialogOpenOptions & { id?: string }
  ) => string;
  closeDialog: (id: string) => void;
  forceCloseAllDialogs: () => void;
};

/**
 * Options for dialog registry registration.
 */
export interface DialogRegistryOptions {
  /**
   * Whether to override an existing dialog if it's already registered.
   * Default: false (will throw error if dialog already exists)
   */
  override?: boolean;
}

/**
 * Helper type to extract props for a specific dialog key from CommonDialogComponentMap.
 * This ensures proper type inference for email dialogs.
 */
export type CommonDialogProps<K extends keyof CommonDialogComponentMap> = Omit<
  React.ComponentProps<CommonDialogComponentMap[K]>,
  "open" | "onOpenChange"
>;
