/**
 * @buildbase/database - Newsletter Subscriber Types
 */

import type { NewsletterSubscriber, NewsletterSubscriberStatus } from "../generated/client";

export type { NewsletterSubscriber, NewsletterSubscriberStatus };

/**
 * Input for creating a newsletter subscriber
 */
export interface CreateNewsletterSubscriberInput {
  email: string;
  source?: string;
  sourceIp?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  workspaceId?: string;
  metadata?: Record<string, unknown>;
  // Double opt-in
  requireConfirmation?: boolean;
}

/**
 * Input for updating a newsletter subscriber
 */
export interface UpdateNewsletterSubscriberInput {
  status?: NewsletterSubscriberStatus;
  isConfirmed?: boolean;
  confirmedAt?: Date;
  unsubscribedAt?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Options for listing newsletter subscribers
 */
export interface ListNewsletterSubscribersOptions {
  workspaceId?: string;
  status?: NewsletterSubscriberStatus;
  isConfirmed?: boolean;
  source?: string;
  search?: string;
  page?: number;
  limit?: number;
  orderBy?: "subscribedAt" | "email" | "createdAt";
  orderDir?: "asc" | "desc";
}

/**
 * Paginated newsletter subscribers result
 */
export interface PaginatedNewsletterSubscribers {
  data: NewsletterSubscriber[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Newsletter subscriber stats
 */
export interface NewsletterSubscriberStats {
  total: number;
  active: number;
  unsubscribed: number;
  bounced: number;
  complained: number;
  confirmed: number;
  unconfirmed: number;
}
