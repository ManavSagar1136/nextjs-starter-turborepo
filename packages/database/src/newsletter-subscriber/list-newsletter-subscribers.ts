/**
 * @buildbase/database - List Newsletter Subscribers
 */

import type { PrismaClient, Prisma } from "../generated/client";
import type {
  ListNewsletterSubscribersOptions,
  PaginatedNewsletterSubscribers,
  NewsletterSubscriberStats,
} from "./types";

/**
 * List newsletter subscribers with pagination and filters
 */
export async function listNewsletterSubscribers(
  prisma: PrismaClient,
  options: ListNewsletterSubscribersOptions = {}
): Promise<PaginatedNewsletterSubscribers> {
  const {
    workspaceId,
    status,
    isConfirmed,
    source,
    search,
    page = 1,
    limit = 20,
    orderBy = "subscribedAt",
    orderDir = "desc",
  } = options;

  // Build where clause
  const where: Prisma.NewsletterSubscriberWhereInput = {};

  if (workspaceId) {
    where.workspaceId = workspaceId;
  }

  if (status) {
    where.status = status;
  }

  if (isConfirmed !== undefined) {
    where.isConfirmed = isConfirmed;
  }

  if (source) {
    where.source = source;
  }

  if (search) {
    where.email = { contains: search, mode: "insensitive" };
  }

  // Get total count
  const total = await prisma.newsletterSubscriber.count({ where });

  // Get paginated data
  const data = await prisma.newsletterSubscriber.findMany({
    where,
    orderBy: { [orderBy]: orderDir },
    skip: (page - 1) * limit,
    take: limit,
  });

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get newsletter subscriber statistics
 */
export async function getNewsletterSubscriberStats(
  prisma: PrismaClient,
  workspaceId?: string
): Promise<NewsletterSubscriberStats> {
  const where = workspaceId ? { workspaceId } : {};

  const [total, active, unsubscribed, bounced, complained, confirmed] = await Promise.all([
    prisma.newsletterSubscriber.count({ where }),
    prisma.newsletterSubscriber.count({ where: { ...where, status: "ACTIVE" } }),
    prisma.newsletterSubscriber.count({ where: { ...where, status: "UNSUBSCRIBED" } }),
    prisma.newsletterSubscriber.count({ where: { ...where, status: "BOUNCED" } }),
    prisma.newsletterSubscriber.count({ where: { ...where, status: "COMPLAINED" } }),
    prisma.newsletterSubscriber.count({ where: { ...where, isConfirmed: true } }),
  ]);

  return {
    total,
    active,
    unsubscribed,
    bounced,
    complained,
    confirmed,
    unconfirmed: total - confirmed,
  };
}

/**
 * Get all active subscriber emails (for bulk sends)
 */
export async function getActiveNewsletterEmails(
  prisma: PrismaClient,
  workspaceId?: string
): Promise<string[]> {
  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: {
      status: "ACTIVE",
      isConfirmed: true,
      ...(workspaceId && { workspaceId }),
    },
    select: { email: true },
  });

  return subscribers.map((s) => s.email);
}
