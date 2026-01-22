/**
 * App-level dialog setup utilities.
 * Each app should create a dialogs setup file that registers its dialogs.
 */

import React from "react";
import { dialogRegistry } from "./registry";
import { initializeCommonDialogs } from "./initialize";
import type { DialogComponentMap } from "./types";
import type { DialogOrSheetBaseProps, DialogOrSheetComponent } from "./base-props";

/**
 * Options for app dialog setup.
 */
export interface AppDialogSetupOptions {
  /**
   * Whether to initialize common dialogs (confirmation, alert).
   * Default: true
   */
  initializeCommon?: boolean;
  /**
   * Whether to override common dialogs if they're already registered.
   * Default: false
   */
  overrideCommon?: boolean;
}

/**
 * Setup dialogs for an app.
 * This should be called once when the app initializes.
 *
 * All dialogs must extend DialogOrSheetBaseProps (have `open` and `onOpenChange` props).
 *
 * @example
 * ```tsx
 * // apps/user/src/dialogs/setup.ts
 * import { setupAppDialogs } from "@buildbase/dialog-manager/app-setup";
 * import { DialogOrSheetBaseProps } from "@buildbase/dialog-manager/base-props";
 * import CreateUserDialog from "./components/CreateUserDialog";
 *
 * interface CreateUserDialogProps extends DialogOrSheetBaseProps {
 *   title?: string;
 * }
 *
 * export function setupUserDialogs() {
 *   setupAppDialogs({
 *     dialogs: {
 *       "user:create": CreateUserDialog, // Must extend DialogOrSheetBaseProps
 *     },
 *     initializeCommon: true,
 *   });
 * }
 * ```
 */
export function setupAppDialogs<T extends DialogComponentMap>(
  dialogs: Partial<T>,
  options: AppDialogSetupOptions = {}
): void {
  const { initializeCommon = true, overrideCommon = false } = options;

  // Initialize common dialogs first
  if (initializeCommon) {
    initializeCommonDialogs();
  }

  // Register app-specific dialogs
  // All components are validated to extend DialogOrSheetBaseProps
  dialogRegistry.registerMany(dialogs, { override: overrideCommon });
}

/**
 * Helper to create lazy dialog/sheet loaders.
 * Useful for code-splitting dialogs that are rarely used.
 * The loaded component must extend DialogOrSheetBaseProps.
 *
 * @example
 * ```tsx
 * // Lazy load a heavy dialog
 * const lazyDeleteDialog = createLazyDialogLoader(
 *   () => import("./dialogs/DeleteDialog")
 * );
 *
 * dialogRegistry.registerLazy("delete-dialog", lazyDeleteDialog);
 * ```
 */
export function createLazyDialogLoader(
  importFn: () => Promise<{ default: DialogOrSheetComponent<DialogOrSheetBaseProps> }>
): () => Promise<{ default: DialogOrSheetComponent<DialogOrSheetBaseProps> }> {
  return importFn;
}
