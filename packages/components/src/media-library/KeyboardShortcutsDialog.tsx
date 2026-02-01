"use client";

import { Keyboard } from "lucide-react";

import { Button } from "@buildbase/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@buildbase/ui/dialog";
import { cn } from "@buildbase/ui/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface KeyboardShortcutsDialogProps {
  className?: string;
  trigger?: React.ReactNode;
}

interface ShortcutGroup {
  title: string;
  shortcuts: Array<{
    keys: string[];
    description: string;
  }>;
}

// ============================================================================
// Keyboard Shortcuts Dialog
// ============================================================================

export function KeyboardShortcutsDialog({ className, trigger }: KeyboardShortcutsDialogProps) {
  const isMac = typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const cmdOrCtrl = isMac ? "⌘" : "Ctrl";

  const shortcutGroups: ShortcutGroup[] = [
    {
      title: "Navigation",
      shortcuts: [
        {
          keys: ["↑", "↓", "←", "→"],
          description: "Navigate between assets",
        },
        {
          keys: ["Shift", "↑", "↓", "←", "→"],
          description: "Multi-select assets",
        },
        {
          keys: ["Enter"],
          description: "Open preview for focused/selected asset",
        },
        {
          keys: ["Esc"],
          description: "Clear selection / Close dialogs",
        },
      ],
    },
    {
      title: "Selection",
      shortcuts: [
        {
          keys: [cmdOrCtrl, "A"],
          description: "Select all assets",
        },
        {
          keys: [cmdOrCtrl, "K"],
          description: "Focus search input",
        },
      ],
    },
    {
      title: "Actions",
      shortcuts: [
        {
          keys: ["Delete"],
          description: "Delete selected assets",
        },
        {
          keys: [cmdOrCtrl, "M"],
          description: "Move selected assets",
        },
        {
          keys: [cmdOrCtrl, "T"],
          description: "Assign tags to selected assets",
        },
      ],
    },
  ];

  const formatKey = (key: string): string => {
    if (key === "⌘") return "⌘";
    if (key === "Ctrl") return "Ctrl";
    if (key === "Shift") return "Shift";
    if (key === "↑") return "↑";
    if (key === "↓") return "↓";
    if (key === "←") return "←";
    if (key === "→") return "→";
    if (key === "Enter") return "Enter";
    if (key === "Esc") return "Esc";
    if (key === "Delete") return "Delete";
    return key.toUpperCase();
  };

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="gap-2" aria-label="Keyboard shortcuts">
      <Keyboard className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">Shortcuts</span>
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild className={className}>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>Use these shortcuts to navigate and manage your media library faster.</DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-6">
          {shortcutGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              <h3 className="mb-3 text-sm font-semibold">{group.title}</h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, shortcutIndex) => (
                  <div key={shortcutIndex} className="flex items-center justify-between border-b py-2 last:border-0">
                    <span className="text-muted-foreground text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1.5">
                      {shortcut.keys.map((key, keyIndex) => (
                        <div key={keyIndex} className="flex items-center gap-1.5">
                          {keyIndex > 0 && <span className="text-muted-foreground">+</span>}
                          <kbd
                            className={cn(
                              "rounded px-2 py-1 text-xs font-semibold",
                              "bg-muted border-border border",
                              "min-w-[2rem] text-center"
                            )}
                          >
                            {formatKey(key)}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
