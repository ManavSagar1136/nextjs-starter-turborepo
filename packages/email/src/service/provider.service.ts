/**
 * @buildbase/email - Provider Service
 * CRUD operations for email provider management
 */

import type { PrismaClient, EmailProvider } from "@buildbase/database";
import type { CreateProviderInput, UpdateProviderInput, ProviderType, PROVIDER_CONFIG_SCHEMA } from "../core/types.js";
import { encryptConfig, decryptConfig } from "../core/encryption.js";
import { ProviderNotFoundError, ValidationError } from "../core/errors.js";

/**
 * Service for managing email providers in the database
 */
export class ProviderService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Create a new email provider
   */
  async create(data: CreateProviderInput, userId?: string): Promise<EmailProvider> {
    // Validate config based on type
    this.validateConfig(data.type, data.config);

    // Encrypt sensitive config
    const encryptedConfig = encryptConfig(data.config);

    // If setting as default, unset other defaults first
    if (data.isDefault) {
      await this.clearDefaults(data.workspaceId);
    }

    return this.prisma.emailProvider.create({
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

  /**
   * Update an existing provider
   */
  async update(id: string, data: UpdateProviderInput, userId?: string): Promise<EmailProvider> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new ProviderNotFoundError(id);
    }

    // If updating config, validate and encrypt
    let encryptedConfig: string | undefined;
    if (data.config) {
      this.validateConfig(existing.type as ProviderType, data.config);
      encryptedConfig = encryptConfig(data.config);
    }

    // If setting as default, unset other defaults first
    if (data.isDefault) {
      await this.clearDefaults(existing.workspaceId);
    }

    return this.prisma.emailProvider.update({
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

  /**
   * Delete a provider
   */
  async delete(id: string): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new ProviderNotFoundError(id);
    }

    await this.prisma.emailProvider.delete({ where: { id } });
  }

  /**
   * Find a provider by ID
   */
  async findById(id: string): Promise<EmailProvider | null> {
    return this.prisma.emailProvider.findUnique({ where: { id } });
  }

  /**
   * Find the default provider for a workspace
   */
  async findDefault(workspaceId?: string): Promise<EmailProvider | null> {
    return this.prisma.emailProvider.findFirst({
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
  async findFirstActive(workspaceId?: string): Promise<EmailProvider | null> {
    return this.prisma.emailProvider.findFirst({
      where: {
        isActive: true,
        workspaceId: workspaceId ?? null,
      },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * List all providers for a workspace
   */
  async list(workspaceId?: string): Promise<EmailProvider[]> {
    return this.prisma.emailProvider.findMany({
      where: { workspaceId: workspaceId ?? null },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });
  }

  /**
   * List active providers only
   */
  async listActive(workspaceId?: string): Promise<EmailProvider[]> {
    return this.prisma.emailProvider.findMany({
      where: {
        workspaceId: workspaceId ?? null,
        isActive: true,
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });
  }

  /**
   * Set a provider as the default
   */
  async setDefault(id: string): Promise<EmailProvider> {
    const provider = await this.findById(id);
    if (!provider) {
      throw new ProviderNotFoundError(id);
    }

    // Clear other defaults
    await this.clearDefaults(provider.workspaceId);

    // Set this one as default
    return this.prisma.emailProvider.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  /**
   * Increment the emails sent counter
   */
  async incrementEmailsSent(id: string): Promise<void> {
    await this.prisma.emailProvider.update({
      where: { id },
      data: {
        emailsSent: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });
  }

  /**
   * Get decrypted config for a provider
   */
  getDecryptedConfig<T extends Record<string, unknown>>(provider: EmailProvider): T {
    return decryptConfig<T>(provider.config);
  }

  /**
   * Validate provider config against schema
   */
  private validateConfig(type: ProviderType, config: Record<string, unknown>): void {
    const requiredFields = this.getRequiredFields(type);

    for (const field of requiredFields) {
      if (config[field] === undefined || config[field] === null || config[field] === "") {
        throw new ValidationError(`Missing required field for ${type} provider: ${field}`, field);
      }
    }
  }

  /**
   * Get required fields for a provider type
   */
  private getRequiredFields(type: ProviderType): string[] {
    const schema: Record<ProviderType, string[]> = {
      CONSOLE: [],
      SMTP: ["host", "port", "username", "password"],
      RESEND: ["apiKey"],
      MAILGUN: ["apiKey", "domain"],
      SENDGRID: ["apiKey"],
      SES: ["region", "accessKeyId", "secretAccessKey"],
    };
    return schema[type] ?? [];
  }

  /**
   * Clear default flag on all providers for a workspace
   */
  private async clearDefaults(workspaceId?: string | null): Promise<void> {
    await this.prisma.emailProvider.updateMany({
      where: {
        workspaceId: workspaceId ?? null,
        isDefault: true,
      },
      data: { isDefault: false },
    });
  }
}
