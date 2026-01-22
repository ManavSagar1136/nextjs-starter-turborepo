import React from "react";

/**
 * Base type for dialog component map.
 * Apps extend this with their own dialog components.
 */
export type DialogComponentMap = Record<string, React.ComponentType<any>>;

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
 * Interface for a dialog instance.
 */
export type DialogInstance<T extends DialogComponentMap = DialogComponentMap> = {
  id: string;
  key: DialogKey<T>;
  props: Omit<DialogPropsMap<T>[DialogKey<T>], "open" | "onOpenChange">;
  createdAt: number;
};

/**
 * Interface for the dialog context, providing methods to open and close dialogs.
 */
export type DialogContextType<T extends DialogComponentMap = DialogComponentMap> = {
  openDialog: <K extends DialogKey<T>>(
    key: K,
    props: Omit<DialogPropsMap<T>[K], "open" | "onOpenChange">,
    id?: string
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
