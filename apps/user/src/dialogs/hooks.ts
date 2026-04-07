import { useDialogManager } from "@buildbase/dialog-manager";
import type { DialogContextType } from "@buildbase/dialog-manager";
import type { UserAppDialogs } from "./setup";

/**
 * Typed dialog manager hook for the user app.
 * Extends the base hook to include user-specific dialog types alongside common dialogs.
 */
export function useUserDialogManager(): DialogContextType<UserAppDialogs> {
  return useDialogManager() as unknown as DialogContextType<UserAppDialogs>;
}
