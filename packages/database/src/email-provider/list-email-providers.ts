/**
 * @buildbase/database - List Email Providers
 */

import type { PrismaClient, EmailProvider } from "../generated/client";

/**
 * List all email providers for a workspace
 */
export async function listEmailProviders(prisma: PrismaClient, workspaceId?: string | null): Promise<EmailProvider[]> {
  const where = workspaceId !== undefined ? { workspaceId: workspaceId ?? null } : {};

  return prisma.emailProvider.findMany({
    where,
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
}

/**
 * List active email providers only
 */
export async function listActiveEmailProviders(
  prisma: PrismaClient,
  workspaceId?: string | null
): Promise<EmailProvider[]> {
  const where: Record<string, unknown> = {
    isActive: true,
  };

  if (workspaceId !== undefined) {
    where.workspaceId = workspaceId ?? null;
  }

  return prisma.emailProvider.findMany({
    where,
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
}
