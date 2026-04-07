import { useDialogManager } from "@buildbase/dialog-manager";
import type { DialogContextType } from "@buildbase/dialog-manager";
import type { AdminAppDialogs } from "./setup";

/**
 * Typed dialog manager hook for the admin app.
 * Extends the base hook to include admin-specific dialog types alongside common dialogs.
 */
export function useAdminDialogManager(): DialogContextType<AdminAppDialogs> {
  return useDialogManager() as unknown as DialogContextType<AdminAppDialogs>;
}
