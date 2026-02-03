/**
 * @buildbase/database - List Waitlist Subscribers
 */

import type { PrismaClient, Prisma } from "../generated/client";
import type {
  ListWaitlistSubscribersOptions,
  PaginatedWaitlistSubscribers,
  WaitlistSubscriberStats,
} from "./types";

/**
 * List waitlist subscribers with pagination and filters
 */
export async function listWaitlistSubscribers(
  prisma: PrismaClient,
  options: ListWaitlistSubscribersOptions = {}
): Promise<PaginatedWaitlistSubscribers> {
  const {
    workspaceId,
    status,
    source,
    search,
    page = 1,
    limit = 20,
    orderBy = "position",
    orderDir = "asc",
  } = options;

  // Build where clause
  const where: Prisma.WaitlistSubscriberWhereInput = {};

  if (workspaceId) {
    where.workspaceId = workspaceId;
  }

  if (status) {
    where.status = status;
  }

  if (source) {
    where.source = source;
  }

  if (search) {
    where.email = { contains: search, mode: "insensitive" };
  }

  // Get total count
  const total = await prisma.waitlistSubscriber.count({ where });

  // Get paginated data
  const data = await prisma.waitlistSubscriber.findMany({
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
 * Get waitlist subscriber statistics
 */
export async function getWaitlistSubscriberStats(
  prisma: PrismaClient,
  workspaceId?: string
): Promise<WaitlistSubscriberStats> {
  const where = workspaceId ? { workspaceId } : {};

  const [total, pending, invited, converted, expired, unsubscribed] = await Promise.all([
    prisma.waitlistSubscriber.count({ where }),
    prisma.waitlistSubscriber.count({ where: { ...where, status: "PENDING" } }),
    prisma.waitlistSubscriber.count({ where: { ...where, status: "INVITED" } }),
    prisma.waitlistSubscriber.count({ where: { ...where, status: "CONVERTED" } }),
    prisma.waitlistSubscriber.count({ where: { ...where, status: "EXPIRED" } }),
    prisma.waitlistSubscriber.count({ where: { ...where, status: "UNSUBSCRIBED" } }),
  ]);

  return {
    total,
    pending,
    invited,
    converted,
    expired,
    unsubscribed,
  };
}

/**
 * Get top referrers on the waitlist
 */
export async function getTopWaitlistReferrers(
  prisma: PrismaClient,
  limit: number = 10,
  workspaceId?: string
): Promise<Array<{ email: string; referralCode: string | null; referralCount: number }>> {
  const subscribers = await prisma.waitlistSubscriber.findMany({
    where: {
      referralCount: { gt: 0 },
      ...(workspaceId && { workspaceId }),
    },
    orderBy: { referralCount: "desc" },
    take: limit,
    select: {
      email: true,
      referralCode: true,
      referralCount: true,
    },
  });

  return subscribers;
}
