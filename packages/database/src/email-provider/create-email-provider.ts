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
 * Create a new email provider
 * Note: Config encryption should be handled at the application layer (email package)
 * Note: Clearing other defaults should be handled at the API layer before calling this function
 */
export async function createEmailProvider(
  prisma: PrismaClient,
  data: CreateEmailProviderInput,
  encryptedConfig: string,
  userId?: string
): Promise<EmailProvider> {
  // Validate config has required fields
  validateConfig(data.type, data.config);

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
