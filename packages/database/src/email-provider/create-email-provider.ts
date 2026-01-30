/**
 * @buildbase/database - Create Email Provider
 */

import type { PrismaClient, EmailProvider } from "../generated/client";
import type { CreateEmailProviderInput, ProviderType } from "./types";
import { PROVIDER_REQUIRED_FIELDS } from "./constants";

/**
 * Validate provider config has required fields
 */
function validateConfig(type: ProviderType, config: Record<string, unknown>): void {
  const requiredFields = PROVIDER_REQUIRED_FIELDS[type] ?? [];

  for (const field of requiredFields) {
    if (config[field] === undefined || config[field] === null || config[field] === "") {
      throw new Error(`Missing required field for ${type} provider: ${field}`);
    }
  }
}

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
 * Create a new email provider
 * Note: Config encryption should be handled at the application layer (email package)
 */
export async function createEmailProvider(
  prisma: PrismaClient,
  data: CreateEmailProviderInput,
  encryptedConfig: string,
  userId?: string
): Promise<EmailProvider> {
  // Validate config has required fields
  validateConfig(data.type, data.config);

  // If setting as default, unset other defaults first
  if (data.isDefault) {
    await clearDefaults(prisma, data.workspaceId);
  }

  return prisma.emailProvider.create({
    data: {
      name: data.name,
      description: data.description,
      type: data.type,
      config: encryptedConfig,
      fromName: data.fromName,
      fromEmail: data.fromEmail,
      replyTo: data.replyTo,
      isDefault: data.isDefault ?? false,
      workspaceId: data.workspaceId,
      createdById: userId,
    },
  });
}
