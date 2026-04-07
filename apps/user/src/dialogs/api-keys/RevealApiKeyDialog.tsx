"use client";

import React, { useState, useEffect, useRef } from "react";
import { Copy, Check, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@buildbase/ui/components/ui/dialog";
import { Button } from "@buildbase/ui/components/ui/button";
import type { DialogOrSheetBaseProps } from "@buildbase/dialog-manager";

export interface RevealApiKeyDialogProps extends DialogOrSheetBaseProps {
  rawKey: string;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const copy = () => {
    void navigator.clipboard.writeText(value);
    setCopied(true);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="ghost" size="icon" onClick={copy} className="h-8 w-8 shrink-0">
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

export const RevealApiKeyDialog: React.FC<RevealApiKeyDialogProps> = ({ open, onOpenChange, rawKey }) => {
  const [visible, setVisible] = useState(false);

  const handleClose = () => {
    setVisible(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save your API key</DialogTitle>
          <DialogDescription>
            This is the only time your full API key will be shown. Copy it now — it cannot be retrieved later.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted flex items-center gap-2 rounded-md px-3 py-2 font-mono text-sm">
          <span className="flex-1 select-all break-all">{visible ? rawKey : "•".repeat(40)}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setVisible(v => !v)}>
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <CopyButton value={rawKey} />
        </div>

        <DialogFooter>
          <Button onClick={handleClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
