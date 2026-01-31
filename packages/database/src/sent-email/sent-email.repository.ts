/**
 * Sent Email Repository
 * CRUD operations for sent emails
 */

import type { PrismaClient, SentEmail, Prisma } from "../generated/client";
import type { CreateSentEmailInput, UpdateSentEmailInput, SentEmailFilters } from "./types";

/**
 * Create a sent email record
 */
export async function createSentEmail(prisma: PrismaClient, input: CreateSentEmailInput): Promise<SentEmail> {
  return prisma.sentEmail.create({
    data: {
      trackingId: input.trackingId,
      to: input.to,
      cc: input.cc ?? [],
      bcc: input.bcc ?? [],
      from: input.from,
      replyTo: input.replyTo,
      subject: input.subject,
      html: input.html,
      text: input.text,
      providerId: input.providerId,
      providerName: input.providerName,
      messageId: input.messageId,
      templateId: input.templateId,
      templateSlug: input.templateSlug,
      status: input.status ?? "SENT",
      error: input.error,
      sentAt: input.sentAt ?? new Date(),
      workspaceId: input.workspaceId,
      userId: input.userId,
      metadata: input.metadata as object | undefined,
    },
  });
}

/**
 * Get sent email by ID
 */
export async function getSentEmailById(prisma: PrismaClient, id: string): Promise<SentEmail | null> {
  return prisma.sentEmail.findUnique({
    where: { id },
  });
}

/**
 * Get sent email by tracking ID
 */
export async function getSentEmailByTrackingId(prisma: PrismaClient, trackingId: string): Promise<SentEmail | null> {
  return prisma.sentEmail.findUnique({
    where: { trackingId },
  });
}

/**
 * Update sent email by ID
 */
export async function updateSentEmail(
  prisma: PrismaClient,
  id: string,
  input: UpdateSentEmailInput
): Promise<SentEmail> {
  return prisma.sentEmail.update({
    where: { id },
    data: {
      status: input.status,
      error: input.error,
      messageId: input.messageId,
      sentAt: input.sentAt,
      deliveredAt: input.deliveredAt,
      metadata: input.metadata as object | undefined,
    },
  });
}

/**
 * Update sent email by tracking ID
 */
export async function updateSentEmailByTrackingId(
  prisma: PrismaClient,
  trackingId: string,
  input: UpdateSentEmailInput
): Promise<SentEmail> {
  return prisma.sentEmail.update({
    where: { trackingId },
    data: {
      status: input.status,
      error: input.error,
      messageId: input.messageId,
      sentAt: input.sentAt,
      deliveredAt: input.deliveredAt,
      metadata: input.metadata as object | undefined,
    },
  });
}

/**
 * List sent emails with filters
 */
export async function listSentEmails(
  prisma: PrismaClient,
  filters?: SentEmailFilters,
  options?: { skip?: number; take?: number; orderBy?: "asc" | "desc" }
): Promise<{ emails: SentEmail[]; total: number }> {
  const where: Prisma.SentEmailWhereInput = {};

  if (filters?.to) {
    where.to = { has: filters.to };
  }
  if (filters?.from) {
    where.from = { contains: filters.from, mode: "insensitive" };
  }
  if (filters?.subject) {
    where.subject = { contains: filters.subject, mode: "insensitive" };
  }
  if (filters?.status) {
    where.status = filters.status;
  }
  if (filters?.providerId) {
    where.providerId = filters.providerId;
  }
  if (filters?.templateId) {
    where.templateId = filters.templateId;
  }
  if (filters?.workspaceId) {
    where.workspaceId = filters.workspaceId;
  }
  if (filters?.userId) {
    where.userId = filters.userId;
  }
  if (filters?.fromDate || filters?.toDate) {
    where.createdAt = {};
    if (filters.fromDate) {
      where.createdAt.gte = filters.fromDate;
    }
    if (filters.toDate) {
      where.createdAt.lte = filters.toDate;
    }
  }

  const [emails, total] = await Promise.all([
    prisma.sentEmail.findMany({
      where,
      skip: options?.skip,
      take: options?.take,
      orderBy: { createdAt: options?.orderBy ?? "desc" },
    }),
    prisma.sentEmail.count({ where }),
  ]);

  return { emails, total };
}

/**
 * Delete sent email by ID
 */
export async function deleteSentEmail(prisma: PrismaClient, id: string): Promise<void> {
  await prisma.sentEmail.delete({
    where: { id },
  });
}

/**
 * Get email statistics
 */
export async function getSentEmailStats(
  prisma: PrismaClient,
  filters?: { workspaceId?: string; fromDate?: Date; toDate?: Date }
): Promise<{
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  bounced: number;
}> {
  const where: Prisma.SentEmailWhereInput = {};

  if (filters?.workspaceId) {
    where.workspaceId = filters.workspaceId;
  }
  if (filters?.fromDate || filters?.toDate) {
    where.createdAt = {};
    if (filters.fromDate) {
      where.createdAt.gte = filters.fromDate;
    }
    if (filters.toDate) {
      where.createdAt.lte = filters.toDate;
    }
  }

  const [total, sent, delivered, failed, bounced] = await Promise.all([
    prisma.sentEmail.count({ where }),
    prisma.sentEmail.count({ where: { ...where, status: "SENT" } }),
    prisma.sentEmail.count({ where: { ...where, status: "DELIVERED" } }),
    prisma.sentEmail.count({ where: { ...where, status: "FAILED" } }),
    prisma.sentEmail.count({ where: { ...where, status: "BOUNCED" } }),
  ]);

  return { total, sent, delivered, failed, bounced };
}
