/**
 * @buildbase/database - Update Contact Submission
 */

import type { PrismaClient, ContactSubmission, Prisma } from "../generated/client";
import type { UpdateContactSubmissionInput } from "./types";

/**
 * Update a contact submission by ID
 */
export async function updateContactSubmission(
  prisma: PrismaClient,
  id: string,
  data: UpdateContactSubmissionInput
): Promise<ContactSubmission> {
  return prisma.contactSubmission.update({
    where: { id },
    data: {
      ...data,
      metadata: (data.metadata as Prisma.InputJsonValue) ?? undefined,
    },
  });
}

/**
 * Mark a contact submission as read
 */
export async function markContactSubmissionRead(
  prisma: PrismaClient,
  id: string
): Promise<ContactSubmission> {
  return prisma.contactSubmission.update({
    where: { id },
    data: {
      status: "READ",
      readAt: new Date(),
    },
  });
}

/**
 * Mark a contact submission as replied
 */
export async function markContactSubmissionReplied(
  prisma: PrismaClient,
  id: string,
  replyContent?: string
): Promise<ContactSubmission> {
  return prisma.contactSubmission.update({
    where: { id },
    data: {
      status: "REPLIED",
      repliedAt: new Date(),
      replyContent,
    },
  });
}

/**
 * Archive a contact submission
 */
export async function archiveContactSubmission(
  prisma: PrismaClient,
  id: string
): Promise<ContactSubmission> {
  return prisma.contactSubmission.update({
    where: { id },
    data: {
      status: "ARCHIVED",
      archivedAt: new Date(),
    },
  });
}

/**
 * Mark a contact submission as spam
 */
export async function markContactSubmissionSpam(
  prisma: PrismaClient,
  id: string
): Promise<ContactSubmission> {
  return prisma.contactSubmission.update({
    where: { id },
    data: {
      status: "SPAM",
    },
  });
}

/**
 * Assign a contact submission to a user
 */
export async function assignContactSubmission(
  prisma: PrismaClient,
  id: string,
  assignedTo: string
): Promise<ContactSubmission> {
  return prisma.contactSubmission.update({
    where: { id },
    data: {
      assignedTo,
    },
  });
}

/**
 * Unassign a contact submission
 */
export async function unassignContactSubmission(
  prisma: PrismaClient,
  id: string
): Promise<ContactSubmission> {
  return prisma.contactSubmission.update({
    where: { id },
    data: {
      assignedTo: null,
    },
  });
}

/**
 * Bulk archive old contact submissions
 */
export async function archiveOldContactSubmissions(
  prisma: PrismaClient,
  daysOld: number = 90,
  workspaceId?: string
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.contactSubmission.updateMany({
    where: {
      status: { in: ["NEW", "READ", "REPLIED"] },
      createdAt: { lt: cutoffDate },
      ...(workspaceId && { workspaceId }),
    },
    data: {
      status: "ARCHIVED",
      archivedAt: new Date(),
    },
  });

  return result.count;
}

/**
 * Delete a contact submission (hard delete)
 */
export async function deleteContactSubmission(
  prisma: PrismaClient,
  id: string
): Promise<void> {
  await prisma.contactSubmission.delete({
    where: { id },
  });
}

/**
 * Bulk delete spam contact submissions
 */
export async function deleteSpamContactSubmissions(
  prisma: PrismaClient,
  workspaceId?: string
): Promise<number> {
  const result = await prisma.contactSubmission.deleteMany({
    where: {
      status: "SPAM",
      ...(workspaceId && { workspaceId }),
    },
  });

  return result.count;
}
