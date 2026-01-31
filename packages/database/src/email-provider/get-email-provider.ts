/**
 * @buildbase/database - Get Email Provider
 */

import type { PrismaClient, EmailProvider } from "../generated/client";

/**
 * Find email provider by ID
 */
export async function getEmailProviderById(prisma: PrismaClient, id: string): Promise<EmailProvider | null> {
  return prisma.emailProvider.findUnique({ where: { id } });
}

/**
 * Find the default provider for a workspace
 */
export async function getDefaultEmailProvider(
  prisma: PrismaClient,
  workspaceId?: string
): Promise<EmailProvider | null> {
  return prisma.emailProvider.findFirst({
    where: {
      isDefault: true,
      isActive: true,
      workspaceId: workspaceId ?? null,
    },
  });
}

/**
 * Find the first active provider (fallback when no default)
 */
export async function getFirstActiveEmailProvider(
  prisma: PrismaClient,
  workspaceId?: string
): Promise<EmailProvider | null> {
  return prisma.emailProvider.findFirst({
    where: {
      isActive: true,
      workspaceId: workspaceId ?? null,
    },
    orderBy: { createdAt: "asc" },
  });
}
