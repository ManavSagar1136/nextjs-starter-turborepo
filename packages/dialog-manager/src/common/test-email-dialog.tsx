"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@buildbase/ui/dialog";
import { Button } from "@buildbase/ui/components/ui/button";
import { Input } from "@buildbase/ui/components/ui/input";
import { Label } from "@buildbase/ui/components/ui/label";
import { Send } from "lucide-react";
import type { DialogOrSheetBaseProps } from "../base-props";

/**
 * Props for the TestEmailDialog
 */
export interface TestEmailDialogProps extends DialogOrSheetBaseProps {
  /**
   * Provider ID to test
   */
  providerId: string;
  /**
   * Provider name (for display)
   */
  providerName?: string;
  /**
   * Callback to test email provider connection and send test email
   * @param providerId - The provider ID to test
   * @param email - The email address to send test email to
   * @returns Promise with test result
   */
  onTestEmail: (
    providerId: string,
    email: string
  ) => Promise<{
    success: boolean;
    connectionValid?: boolean;
    emailSent?: boolean;
    messageId?: string;
    error?: string;
  }>;
  /**
   * Optional callback when test is successful
   */
  onSuccess?: (result: { messageId?: string; email: string }) => void;
}

/**
 * Dialog for testing email provider by sending a test email
 */
export function TestEmailDialog({
  open,
  onOpenChange,
  providerId,
  providerName,
  onTestEmail,
  onSuccess,
}: TestEmailDialogProps) {
  const [email, setEmail] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendTestEmail = async () => {
    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsTesting(true);
    setError(null);

    try {
      const result = await onTestEmail(providerId, email);

      if (!result.connectionValid) {
        setError(result.error || "Connection test failed. Please check your provider credentials.");
        return;
      }

      if (result.emailSent) {
        onSuccess?.({
          messageId: result.messageId,
          email,
        });
        setEmail("");
        onOpenChange(false);
      } else if (result.error) {
        setError(result.error);
      } else {
        onSuccess?.({
          messageId: result.messageId,
          email,
        });
        setEmail("");
        onOpenChange(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send test email. Please try again.");
    } finally {
      setIsTesting(false);
    }
  };

  const handleClose = () => {
    if (!isTesting) {
      setEmail("");
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Test Email</DialogTitle>
          <DialogDescription>
            {providerName && (
              <>
                Testing provider: <strong>{providerName}</strong>
                <br />
              </>
            )}
            First, we'll validate your provider credentials. Then enter an email address to send a test email and see
            how it looks.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="test-email">Email Address</Label>
            <Input
              id="test-email"
              type="email"
              placeholder="your-email@example.com"
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                setError(null);
              }}
              onKeyDown={e => {
                if (e.key === "Enter" && email.trim() && !isTesting) {
                  handleSendTestEmail();
                }
              }}
              disabled={isTesting}
              className={error ? "border-destructive" : ""}
            />
            {error && <p className="text-destructive text-sm">{error}</p>}
            <p className="text-muted-foreground text-xs">
              We'll validate credentials first, then send a test email to this address.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isTesting}>
            Cancel
          </Button>
          <Button onClick={handleSendTestEmail} disabled={!email.trim() || isTesting}>
            {isTesting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Testing...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Test Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TestEmailDialog;
