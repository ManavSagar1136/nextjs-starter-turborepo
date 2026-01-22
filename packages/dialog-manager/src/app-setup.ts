/**
 * App-level dialog setup utilities.
 * Each app should create a dialogs setup file that registers its dialogs.
 */

import React from "react";
import { dialogRegistry } from "./registry";
import { initializeCommonDialogs } from "./initialize";
import type { DialogComponentMap } from "./types";

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
 * @example
 * ```tsx
 * // apps/user/src/dialogs/setup.ts
 * import { setupAppDialogs } from "@buildbase/dialog-manager/app-setup";
 * import { UserDialogs } from "./user-dialogs";
 *
 * export function setupUserDialogs() {
 *   setupAppDialogs({
 *     dialogs: UserDialogs,
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
  dialogRegistry.registerMany(dialogs, { override: overrideCommon });
}

/**
 * Helper to create lazy dialog loaders.
 * Useful for code-splitting dialogs that are rarely used.
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
  importFn: () => Promise<{ default: React.ComponentType<any> }>
): () => Promise<{ default: React.ComponentType<any> }> {
  return importFn;
}
