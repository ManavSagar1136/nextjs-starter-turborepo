import React from "react";
import type { DialogOrSheetBaseProps, DialogOrSheetComponent } from "./base-props";

/**
 * Base type for dialog component map.
 * All components in the map must extend DialogOrSheetBaseProps to ensure
 * they have the required `open` and `onOpenChange` props.
 *
 * Apps extend this with their own dialog/sheet components.
 */
export type DialogComponentMap = Record<string, DialogOrSheetComponent<DialogOrSheetBaseProps>>;

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
