/**
 * @buildbase/database - List Contact Submissions
 */

import type { PrismaClient, Prisma } from "../generated/client";
import type {
  ListContactSubmissionsOptions,
  PaginatedContactSubmissions,
  ContactSubmissionStats,
} from "./types";

/**
 * List contact submissions with pagination and filters
 */
export async function listContactSubmissions(
  prisma: PrismaClient,
  options: ListContactSubmissionsOptions = {}
): Promise<PaginatedContactSubmissions> {
  const {
    workspaceId,
    status,
    category,
    priority,
    assignedTo,
    search,
    dateFrom,
    dateTo,
    page = 1,
    limit = 20,
    orderBy = "createdAt",
    orderDir = "desc",
  } = options;

  // Build where clause
  const where: Prisma.ContactSubmissionWhereInput = {};

  if (workspaceId) {
    where.workspaceId = workspaceId;
  }

  if (status) {
    where.status = status;
  }

  if (category) {
    where.category = category;
  }

  if (priority) {
    where.priority = priority;
  }

  if (assignedTo) {
    where.assignedTo = assignedTo;
  }

  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { subject: { contains: search, mode: "insensitive" } },
      { message: { contains: search, mode: "insensitive" } },
    ];
  }

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) {
      where.createdAt.gte = dateFrom;
    }
    if (dateTo) {
      where.createdAt.lte = dateTo;
    }
  }

  // Get total count
  const total = await prisma.contactSubmission.count({ where });

  // Get paginated data
  const data = await prisma.contactSubmission.findMany({
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
 * Get contact submission statistics
 */
export async function getContactSubmissionStats(
  prisma: PrismaClient,
  workspaceId?: string
): Promise<ContactSubmissionStats> {
  const where = workspaceId ? { workspaceId } : {};

  // Calculate date ranges
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  const [total, newCount, read, replied, archived, spam, today, thisWeek] = await Promise.all([
    prisma.contactSubmission.count({ where }),
    prisma.contactSubmission.count({ where: { ...where, status: "NEW" } }),
    prisma.contactSubmission.count({ where: { ...where, status: "READ" } }),
    prisma.contactSubmission.count({ where: { ...where, status: "REPLIED" } }),
    prisma.contactSubmission.count({ where: { ...where, status: "ARCHIVED" } }),
    prisma.contactSubmission.count({ where: { ...where, status: "SPAM" } }),
    prisma.contactSubmission.count({
      where: { ...where, createdAt: { gte: todayStart } },
    }),
    prisma.contactSubmission.count({
      where: { ...where, createdAt: { gte: weekStart } },
    }),
  ]);

  return {
    total,
    new: newCount,
    read,
    replied,
    archived,
    spam,
    today,
    thisWeek,
  };
}

/**
 * Get distinct categories used in contact submissions
 */
export async function getContactSubmissionCategories(
  prisma: PrismaClient,
  workspaceId?: string
): Promise<string[]> {
  const submissions = await prisma.contactSubmission.findMany({
    where: {
      category: { not: null },
      ...(workspaceId && { workspaceId }),
    },
    select: { category: true },
    distinct: ["category"],
  });

  return submissions.map((s) => s.category).filter((c): c is string => c !== null);
}
