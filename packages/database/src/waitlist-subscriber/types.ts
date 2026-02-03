/**
 * @buildbase/database - Waitlist Subscriber Types
 */

import type { WaitlistSubscriber, WaitlistSubscriberStatus } from "../generated/client";

export type { WaitlistSubscriber, WaitlistSubscriberStatus };

/**
 * Input for creating a waitlist subscriber
 */
export interface CreateWaitlistSubscriberInput {
  email: string;
  source?: string;
  sourceIp?: string;
  referrer?: string;
  referredBy?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  workspaceId?: string;
  metadata?: Record<string, unknown>;
  // Auto-generate referral code
  generateReferralCode?: boolean;
}

/**
 * Input for updating a waitlist subscriber
 */
export interface UpdateWaitlistSubscriberInput {
  status?: WaitlistSubscriberStatus;
  position?: number;
  invitedAt?: Date;
  convertedAt?: Date;
  unsubscribedAt?: Date;
  inviteToken?: string;
  inviteExpires?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Options for listing waitlist subscribers
 */
export interface ListWaitlistSubscribersOptions {
  workspaceId?: string;
  status?: WaitlistSubscriberStatus;
  source?: string;
  search?: string;
  page?: number;
  limit?: number;
  orderBy?: "subscribedAt" | "position" | "email" | "createdAt";
  orderDir?: "asc" | "desc";
}

/**
 * Paginated waitlist subscribers result
 */
export interface PaginatedWaitlistSubscribers {
  data: WaitlistSubscriber[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Waitlist subscriber stats
 */
export interface WaitlistSubscriberStats {
  total: number;
  pending: number;
  invited: number;
  converted: number;
  expired: number;
  unsubscribed: number;
}
