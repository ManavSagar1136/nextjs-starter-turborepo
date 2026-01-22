import { createContext } from "react";
import type { DialogContextType } from "./types";

/**
 * Default context value for the dialog context.
 */
export const DEFAULT_CONTEXT_VALUE: DialogContextType = {
  openDialog: () => "",
  closeDialog: () => {},
  forceCloseAllDialogs: () => {},
};

/**
 * Context instance for managing dialogs.
 */
export const DialogContext = createContext<DialogContextType>(DEFAULT_CONTEXT_VALUE);
