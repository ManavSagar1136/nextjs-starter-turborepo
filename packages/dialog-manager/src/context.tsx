import { createContext } from "react";
import type { DialogContextType, CommonDialogComponentMap } from "./types";

/**
 * Default context value for the dialog context.
 */
export const DEFAULT_CONTEXT_VALUE: DialogContextType<CommonDialogComponentMap> = {
  openDialog: () => "",
  closeDialog: () => {},
  forceCloseAllDialogs: () => {},
};

/**
 * Context instance for managing dialogs.
 */
export const DialogContext = createContext<DialogContextType<CommonDialogComponentMap>>(DEFAULT_CONTEXT_VALUE);
