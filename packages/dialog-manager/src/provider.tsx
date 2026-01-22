"use client";

import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { dialogRegistry } from "./registry";
import { DIALOG_AUTO_CLEANUP_DELAY_MS, DIALOG_URL_PARAMS, DIALOG_URL_BLACKLIST, COMMON_DIALOG_KEYS } from "./config";
import { DialogContext } from "./context";
import type { DialogInstance, DialogKey, DialogComponentMap } from "./types";

/**
 * Props for DialogProvider.
 */
export interface DialogProviderProps {
  children: ReactNode;
  /**
   * Optional callback to handle toast notifications.
   * If not provided, console.log/console.error will be used.
   */
  onToast?: (options: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
  /**
   * Whether to enable URL-based dialog opening.
   * Default: true
   */
  enableUrlDialogs?: boolean;
  /**
   * Custom dialog component map to use instead of the registry.
   * If provided, this will override the registry.
   */
  customDialogs?: DialogComponentMap;
}

/**
 * Provides context and rendering logic for dialogs across the application.
 */
export const DialogProvider = ({ children, onToast, enableUrlDialogs = true, customDialogs }: DialogProviderProps) => {
  const [openDialogIds, setOpenDialogIds] = useState<Set<string>>(new Set());
  const [dialogMap] = useState<Map<string, DialogInstance>>(new Map());
  const cleanupTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get dialog components from registry or custom dialogs
  const dialogComponents = useMemo(() => {
    return customDialogs || dialogRegistry.getAll();
  }, [customDialogs]);

  /**
   * Opens a new dialog instance or updates an existing one by ID.
   */
  const openDialog = useCallback(
    <K extends DialogKey>(
      key: K,
      props: Omit<React.ComponentProps<(typeof dialogComponents)[K]>, "open" | "onOpenChange">,
      options?: { id?: string; onClose?: () => void; onOpen?: () => void }
    ) => {
      const dialogMapId = options?.id ? `${key}-${options.id}` : `${key}-${Date.now()}`;

      // Cancel cleanup if dialog was recently closed
      const existingTimer = cleanupTimersRef.current.get(dialogMapId);
      if (existingTimer) {
        clearTimeout(existingTimer);
        cleanupTimersRef.current.delete(dialogMapId);
      }

      const isNewDialog = !openDialogIds.has(dialogMapId);

      dialogMap.set(dialogMapId, {
        id: dialogMapId,
        key,
        props,
        options: {
          onClose: options?.onClose,
          onOpen: options?.onOpen,
        },
        createdAt: new Date().getTime(),
      });

      setOpenDialogIds(prev => {
        const updated = new Set(prev);
        updated.add(dialogMapId);
        return updated;
      });

      // Call onOpen callback if this is a new dialog
      if (isNewDialog && options?.onOpen) {
        // Use setTimeout to ensure dialog is rendered first
        setTimeout(() => {
          options.onOpen?.();
        }, 0);
      }

      return dialogMapId;
    },
    [dialogMap, dialogComponents, openDialogIds]
  );

  /**
   * Effect to handle opening dialogs from URL search parameters.
   */
  useEffect(() => {
    if (!enableUrlDialogs || typeof window === "undefined") {
      return;
    }

    const dialogKey = searchParams.get(DIALOG_URL_PARAMS.DIALOG);
    const dialogPropsParam = searchParams.get(DIALOG_URL_PARAMS.DIALOG_PROPS);

    // Check if dialog key exists in URL
    if (dialogKey) {
      const isValidDialogKey = dialogRegistry.has(dialogKey) || (customDialogs && dialogKey in customDialogs);

      // Check if dialog is blacklisted from URL opening
      const isBlacklisted = DIALOG_URL_BLACKLIST.includes(dialogKey as any);

      if (isValidDialogKey && !isBlacklisted) {
        try {
          let dialogProps: Record<string, any> = {};

          // Parse dialog props from URL if provided
          if (dialogPropsParam) {
            dialogProps = JSON.parse(decodeURIComponent(dialogPropsParam));
          }

          // Open the dialog with the parsed props
          openDialog(dialogKey as DialogKey, dialogProps);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          if (onToast) {
            onToast({
              title: "Failed to open dialog",
              description: "Unable to open the requested dialog. Please try again.",
              variant: "destructive",
            });
          } else {
            console.error("Failed to open dialog:", errorMessage);
          }
        }
      }

      // Clean up URL parameters regardless of validity or success
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete(DIALOG_URL_PARAMS.DIALOG);
      newSearchParams.delete(DIALOG_URL_PARAMS.DIALOG_PROPS);

      const newSearch = newSearchParams.toString();
      const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ""}`;

      // Use replace to avoid adding to browser history
      router.replace(newUrl);
    }
  }, [searchParams, openDialog, router, enableUrlDialogs, customDialogs, onToast]);

  /**
   * Closes the dialog and schedules a cleanup to remove its entry after a delay.
   */
  const closeDialog = useCallback(
    (id: string) => {
      const dialog = dialogMap.get(id);
      const wasOpen = openDialogIds.has(id);

      setOpenDialogIds(prev => {
        const updated = new Set(prev);
        updated.delete(id);

        if (!cleanupTimersRef.current.has(id)) {
          const timer = setTimeout(() => {
            dialogMap.delete(id);
            cleanupTimersRef.current.delete(id);
          }, DIALOG_AUTO_CLEANUP_DELAY_MS);

          cleanupTimersRef.current.set(id, timer);
        }

        return updated;
      });

      // Call onClose callback if dialog was open
      if (wasOpen && dialog?.options?.onClose) {
        dialog.options.onClose();
      }
    },
    [dialogMap, openDialogIds]
  );

  /**
   * Forces the closure of all active dialogs.
   */
  const forceCloseAllDialogs = useCallback(() => {
    setOpenDialogIds(new Set());
    cleanupTimersRef.current.forEach(timer => clearTimeout(timer));
    cleanupTimersRef.current.clear();
    dialogMap.clear();
  }, [dialogMap]);

  const dialogValues = dialogMap.values();

  const orderedDialogs = useMemo(() => {
    const tempOrderedDialogs = Array.from(dialogValues);
    tempOrderedDialogs.sort((a, b) => a.createdAt - b.createdAt);
    return tempOrderedDialogs;
  }, [dialogValues]);

  // State for lazy-loaded dialogs
  const [lazyDialogs, setLazyDialogs] = useState<Map<string, React.ComponentType<any>>>(new Map());

  // Load lazy dialogs when they're opened
  useEffect(() => {
    const loadLazyDialogs = async () => {
      const dialogsToLoad: Array<{ key: string; component: React.ComponentType<any> }> = [];

      for (const dialog of orderedDialogs) {
        if (!openDialogIds.has(dialog.id)) continue;

        const Comp = dialogComponents[dialog.key as keyof typeof dialogComponents];

        // If component is not loaded and not in lazy cache, try to lazy load it
        if (!Comp && !lazyDialogs.has(dialog.key)) {
          const loadedComponent = await dialogRegistry.get(dialog.key);
          if (loadedComponent) {
            dialogsToLoad.push({ key: dialog.key, component: loadedComponent });
          }
        }
      }

      if (dialogsToLoad.length > 0) {
        setLazyDialogs(prev => {
          const updated = new Map(prev);
          dialogsToLoad.forEach(({ key, component }) => {
            updated.set(key, component);
          });
          return updated;
        });
      }
    };

    loadLazyDialogs();
  }, [orderedDialogs, openDialogIds, dialogComponents]);

  return (
    <DialogContext.Provider value={{ openDialog, closeDialog, forceCloseAllDialogs }}>
      {children}
      {orderedDialogs.map(dialog => {
        const isOpen = openDialogIds.has(dialog.id);

        const commonProps = {
          ...dialog.props,
          open: isOpen,
          onOpenChange: (open: boolean) => {
            if (!open) {
              closeDialog(dialog.id);
            }
            (dialog.props as { onOpenChange?: (open: boolean) => void }).onOpenChange?.(open);
          },
        };

        // Try to get component from pre-loaded, then lazy cache
        const Comp = dialogComponents[dialog.key as keyof typeof dialogComponents] || lazyDialogs.get(dialog.key);

        if (!Comp) {
          if (typeof window !== "undefined") {
            console.warn(`Dialog component not found for key: ${dialog.key}`);
          }
          return null;
        }

        return <Comp key={dialog.id} {...(commonProps as any)} />;
      })}
    </DialogContext.Provider>
  );
};
