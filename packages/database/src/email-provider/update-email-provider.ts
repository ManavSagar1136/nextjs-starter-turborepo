/**
 * @buildbase/database - Update Email Provider
 */

import type { PrismaClient, EmailProvider } from "../generated/client";
import type { UpdateEmailProviderInput } from "./types";

/**
 * Update an existing email provider
 * Note: If updating config, pass the encrypted config string
 * Note: Clearing other defaults should be handled at the API layer before calling this function
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
