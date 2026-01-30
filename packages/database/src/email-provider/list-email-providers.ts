/**
 * @buildbase/database - List Email Providers
 */

import type { PrismaClient, EmailProvider } from "../generated/client";

/**
 * List all email providers for a workspace
 */
export async function listEmailProviders(prisma: PrismaClient, workspaceId?: string): Promise<EmailProvider[]> {
  return prisma.emailProvider.findMany({
    where: { workspaceId: workspaceId ?? null },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
}

/**
 * List active email providers only
 */
export async function listActiveEmailProviders(prisma: PrismaClient, workspaceId?: string): Promise<EmailProvider[]> {
  return prisma.emailProvider.findMany({
    where: {
      workspaceId: workspaceId ?? null,
      isActive: true,
    },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
}
