/**
 * @buildbase/database - Get Contact Submission
 */

import type { PrismaClient, ContactSubmission } from "../generated/client";

/**
 * Get a contact submission by ID
 */
export async function getContactSubmissionById(
  prisma: PrismaClient,
  id: string
): Promise<ContactSubmission | null> {
  return prisma.contactSubmission.findUnique({
    where: { id },
  });
}

/**
 * Get contact submissions by email
 */
export async function getContactSubmissionsByEmail(
  prisma: PrismaClient,
  email: string,
  limit: number = 10
): Promise<ContactSubmission[]> {
  return prisma.contactSubmission.findMany({
    where: { email: email.toLowerCase().trim() },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Get unread (new) contact submissions count
 */
export async function getUnreadContactSubmissionsCount(
  prisma: PrismaClient,
  workspaceId?: string
): Promise<number> {
  return prisma.contactSubmission.count({
    where: {
      status: "NEW",
      ...(workspaceId && { workspaceId }),
    },
  });
}
