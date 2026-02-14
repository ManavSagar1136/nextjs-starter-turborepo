/**
 * @buildbase/database - Email Provider Types
 */

import type { EmailProvider } from "@prisma/client";

export type ProviderType = "CONSOLE" | "SMTP" | "RESEND" | "MAILGUN" | "SENDGRID" | "SES";

export interface CreateEmailProviderInput {
  name: string;
  description?: string;
  type: ProviderType;
  config: Record<string, unknown>;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  isDefault?: boolean;
  workspaceId?: string;
}

export interface UpdateEmailProviderInput {
  name?: string;
  description?: string;
  config?: Record<string, unknown>;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  isActive?: boolean;
  isDefault?: boolean;
}
