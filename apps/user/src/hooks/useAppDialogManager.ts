"use client";

import { useDialogManager } from "@buildbase/dialog-manager";
import type { DialogContextType } from "@buildbase/dialog-manager";
// type-only import — no runtime circular dependency
import type { UserAppDialogs } from "../dialogs/setup";

/**
 * Typed wrapper around useDialogManager for the user app.
 * Returns a fully-typed openDialog that knows about all registered dialogs,
 * including app-specific ones like FeatureAccessDeniedDialog.
 */
export const useAppDialogManager = (): DialogContextType<UserAppDialogs> =>
  useDialogManager() as DialogContextType<UserAppDialogs>;
