/**
 * Sent Email Types
 */

import type { EmailStatus } from "../generated/client";

export type { EmailStatus };

export interface CreateSentEmailInput {
  trackingId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  from: string;
  replyTo?: string;
  subject: string;
  html?: string;
  text?: string;
  providerId?: string;
  providerName?: string;
  messageId?: string;
  templateId?: string;
  templateSlug?: string;
  status?: EmailStatus;
  error?: string;
  sentAt?: Date;
  workspaceId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateSentEmailInput {
  status?: EmailStatus;
  error?: string;
  messageId?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface SentEmailFilters {
  to?: string;
  from?: string;
  subject?: string;
  status?: EmailStatus;
  providerId?: string;
  templateId?: string;
  workspaceId?: string;
  userId?: string;
  fromDate?: Date;
  toDate?: Date;
}
