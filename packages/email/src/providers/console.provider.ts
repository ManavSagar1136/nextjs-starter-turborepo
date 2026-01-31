/**
 * @buildbase/email - Console Provider
 * Development provider that logs emails to console
 */

import { randomUUID } from "crypto";
import type { ProviderType, SendEmailOptions, SendResult } from "../core/types.js";
import { BaseProvider, type DbEmailProvider } from "./base.provider.js";

/**
 * Default console provider for development
 */
const DEFAULT_CONSOLE_PROVIDER: DbEmailProvider = {
  id: "console-dev",
  name: "Console (Development)",
  type: "CONSOLE",
  fromName: "Dev Mode",
  fromEmail: "dev@localhost",
};

/**
 * Console provider - logs emails instead of sending
 * Used for development and testing
 */
export class ConsoleProvider extends BaseProvider {
  public readonly type: ProviderType = "CONSOLE";

  constructor(dbProvider?: DbEmailProvider) {
    super(dbProvider ?? DEFAULT_CONSOLE_PROVIDER);
  }

  /**
   * "Send" an email by logging it to console
   */
  async send(options: SendEmailOptions): Promise<SendResult> {
    const trackingId = this.generateTrackingId(options.trackingId);
    const messageId = `console_${randomUUID()}`;
    const from = this.formatFrom(options.from);
    const to = Array.isArray(options.to) ? options.to.join(", ") : options.to;

    // Log email details
    console.log("\n" + "=".repeat(60));
    console.log("📧 EMAIL SENT (Console Provider - Development Mode)");
    console.log("=".repeat(60));
    console.log(`From:       ${from}`);
    console.log(`To:         ${to}`);
    if (options.cc?.length) {
      console.log(`CC:         ${options.cc.join(", ")}`);
    }
    if (options.bcc?.length) {
      console.log(`BCC:        ${options.bcc.join(", ")}`);
    }
    console.log(`Subject:    ${options.subject}`);
    console.log(`Tracking:   ${trackingId}`);
    console.log(`Message ID: ${messageId}`);
    console.log("-".repeat(60));
    console.log("HTML Preview (first 500 chars):");
    console.log(options.html.substring(0, 500) + (options.html.length > 500 ? "..." : ""));
    if (options.text) {
      console.log("-".repeat(60));
      console.log("Text Preview:");
      console.log(options.text.substring(0, 300) + (options.text.length > 300 ? "..." : ""));
    }
    if (options.attachments?.length) {
      console.log("-".repeat(60));
      console.log(`Attachments: ${options.attachments.map(a => a.filename).join(", ")}`);
    }
    if (options.tags?.length) {
      console.log(`Tags:       ${options.tags.join(", ")}`);
    }
    console.log("=".repeat(60) + "\n");

    return this.createSuccessResult(messageId, trackingId);
  }

  /**
   * Test connection - always succeeds for console
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }
}

/**
 * Create a default console provider instance
 */
export function createConsoleProvider(): ConsoleProvider {
  return new ConsoleProvider();
}
