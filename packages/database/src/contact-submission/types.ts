/**
 * @buildbase/database - Contact Submission Types
 */

import type { ContactSubmission, ContactSubmissionStatus } from "@prisma/client";

export type { ContactSubmission, ContactSubmissionStatus };

/**
 * Input for creating a contact submission
 */
export interface CreateContactSubmissionInput {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  subject?: string;
  message: string;
  category?: string;
  priority?: string;
  source?: string;
  sourceIp?: string;
  referrer?: string;
  pageUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  workspaceId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Input for updating a contact submission
 */
export interface UpdateContactSubmissionInput {
  status?: ContactSubmissionStatus;
  category?: string;
  priority?: string;
  assignedTo?: string;
  readAt?: Date;
  repliedAt?: Date;
  archivedAt?: Date;
  replyContent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Options for listing contact submissions
 */
export interface ListContactSubmissionsOptions {
  workspaceId?: string;
  status?: ContactSubmissionStatus;
  category?: string;
  priority?: string;
  assignedTo?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
  orderBy?: "createdAt" | "email" | "status" | "priority";
  orderDir?: "asc" | "desc";
}

/**
 * Paginated contact submissions result
 */
export interface PaginatedContactSubmissions {
  data: ContactSubmission[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Contact submission stats
 */
export interface ContactSubmissionStats {
  total: number;
  new: number;
  read: number;
  replied: number;
  archived: number;
  spam: number;
  today: number;
  thisWeek: number;
}
