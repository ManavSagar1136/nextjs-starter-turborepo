"use client";

import { useEffect, useCallback } from "react";

interface KeyboardShortcutsOptions {
  onSearchFocus?: () => void;
  onSelectAll?: () => void;
  onDelete?: () => void;
  onMove?: () => void;
  onAssignTags?: () => void;
  onClearSelection?: () => void;
  onEscape?: () => void;
  onArrowKey?: (direction: "up" | "down" | "left" | "right") => void;
  onEnter?: () => void;
  onShiftArrow?: (direction: "up" | "down" | "left" | "right") => void;
  enabled?: boolean;
}

/**
 * Hook for keyboard shortcuts in media library
 */
export function useKeyboardShortcuts({
  onSearchFocus,
  onSelectAll,
  onDelete,
  onMove,
  onAssignTags,
  onClearSelection,
  onEscape,
  onArrowKey,
  onEnter,
  onShiftArrow,
  enabled = true,
}: KeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        target.closest("[contenteditable]")
      ) {
        // Allow Escape to work even in inputs
        if (event.key === "Escape" && onEscape) {
          event.preventDefault();
          onEscape();
        }
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const ctrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

      // Ctrl/Cmd + K - Focus search
      if (ctrlOrCmd && event.key === "k") {
        event.preventDefault();
        onSearchFocus?.();
        return;
      }

      // Ctrl/Cmd + A - Select all assets
      if (ctrlOrCmd && event.key === "a") {
        event.preventDefault();
        onSelectAll?.();
        return;
      }

      // Delete - Delete selected assets
      if (event.key === "Delete" && !ctrlOrCmd && !event.shiftKey) {
        event.preventDefault();
        onDelete?.();
        return;
      }

      // Ctrl/Cmd + M - Move selected assets
      if (ctrlOrCmd && event.key === "m") {
        event.preventDefault();
        onMove?.();
        return;
      }

      // Ctrl/Cmd + T - Assign tags to selected assets
      if (ctrlOrCmd && event.key === "t") {
        event.preventDefault();
        onAssignTags?.();
        return;
      }

      // Escape - Clear selection / Close dialogs
      if (event.key === "Escape") {
        event.preventDefault();
        onClearSelection?.();
        onEscape?.();
        return;
      }

      // Arrow keys - Navigate assets
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        if (event.shiftKey && onShiftArrow) {
          event.preventDefault();
          const direction = event.key.replace("Arrow", "").toLowerCase() as "up" | "down" | "left" | "right";
          onShiftArrow(direction);
          return;
        } else if (onArrowKey) {
          event.preventDefault();
          const direction = event.key.replace("Arrow", "").toLowerCase() as "up" | "down" | "left" | "right";
          onArrowKey(direction);
          return;
        }
      }

      // Enter - Open preview for selected asset
      if (event.key === "Enter" && !ctrlOrCmd && !event.shiftKey) {
        event.preventDefault();
        onEnter?.();
        return;
      }
    },
    [
      enabled,
      onSearchFocus,
      onSelectAll,
      onDelete,
      onMove,
      onAssignTags,
      onClearSelection,
      onEscape,
      onArrowKey,
      onEnter,
      onShiftArrow,
    ]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}
