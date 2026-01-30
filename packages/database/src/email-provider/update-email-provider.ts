/**
 * @buildbase/database - Update Email Provider
 */

import type { PrismaClient, EmailProvider } from "../generated/client";
import type { UpdateEmailProviderInput } from "./types";

/**
 * Clear default flag on all providers for a workspace
 */
async function clearDefaults(prisma: PrismaClient, workspaceId?: string | null): Promise<void> {
  await prisma.emailProvider.updateMany({
    where: {
      workspaceId: workspaceId ?? null,
      isDefault: true,
    },
    data: { isDefault: false },
  });
}

/**
 * Update an existing email provider
 * Note: If updating config, pass the encrypted config string
 */
export async function updateEmailProvider(
  prisma: PrismaClient,
  id: string,
  data: UpdateEmailProviderInput,
  encryptedConfig?: string,
  userId?: string
): Promise<EmailProvider> {
  const existing = await prisma.emailProvider.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`Email provider not found: ${id}`);
  }

  // If setting as default, unset other defaults first
  if (data.isDefault) {
    await clearDefaults(prisma, existing.workspaceId);
  }

  return prisma.emailProvider.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(encryptedConfig && { config: encryptedConfig }),
      ...(data.fromName && { fromName: data.fromName }),
      ...(data.fromEmail && { fromEmail: data.fromEmail }),
      ...(data.replyTo !== undefined && { replyTo: data.replyTo }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
      updatedById: userId,
    },
  });
}
