import { useContext } from "react";
import { DEFAULT_CONTEXT_VALUE, DialogContext } from "./context";
import type { DialogContextType, CommonDialogComponentMap } from "./types";

/**
 * Hook to access the DialogContext. Must be used within a DialogProvider.
 */
export const useDialogManager = (): DialogContextType<CommonDialogComponentMap> => {
  const ctx = useContext(DialogContext);

  // Prevent SSR error
  if (typeof window === "undefined" && !ctx) {
    return DEFAULT_CONTEXT_VALUE as DialogContextType<CommonDialogComponentMap>;
  }

  if (!ctx) throw new Error("useDialogManager must be used within DialogProvider");

  return ctx as DialogContextType<CommonDialogComponentMap>;
};
