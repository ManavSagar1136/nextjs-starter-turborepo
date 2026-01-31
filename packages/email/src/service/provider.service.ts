/**
 * @buildbase/email - Provider Service
 * Provider management with encryption (uses @buildbase/database for CRUD)
 */

import type { PrismaClient, EmailProvider } from "@buildbase/database";
import {
  createEmailProvider,
  updateEmailProvider,
  deleteEmailProvider,
  getEmailProviderById,
  getDefaultEmailProvider,
  getFirstActiveEmailProvider,
  listEmailProviders,
  listActiveEmailProviders,
  setDefaultEmailProvider,
  incrementEmailsSent as dbIncrementEmailsSent,
  type CreateEmailProviderInput,
  type UpdateEmailProviderInput,
  type ProviderType,
} from "@buildbase/database";
import { encryptConfig, decryptConfig } from "../core/encryption.js";

/**
 * Error thrown when provider is not found
 */
export class ProviderNotFoundError extends Error {
  constructor(id: string) {
    super(`Email provider not found: ${id}`);
    this.name = "ProviderNotFoundError";
  }
}

/**
 * Service for managing email providers
 */
export class ProviderService {
  constructor(private readonly prisma: PrismaClient) {}

  // ===== CRUD Operations (delegated to @buildbase/database with encryption) =====

  /**
   * Create a new email provider
   */
  async create(data: CreateEmailProviderInput, userId?: string): Promise<EmailProvider> {
    const encryptedConfig = encryptConfig(data.config);
    return createEmailProvider(this.prisma, data, encryptedConfig, userId);
  }

  /**
   * Update an existing provider
   */
  async update(id: string, data: UpdateEmailProviderInput, userId?: string): Promise<EmailProvider> {
    // Get existing to validate type if updating config
    const existing = await this.findById(id);
    if (!existing) {
      throw new ProviderNotFoundError(id);
    }

    let encryptedConfig: string | undefined;
    if (data.config) {
      encryptedConfig = encryptConfig(data.config);
    }

    return updateEmailProvider(this.prisma, id, data, encryptedConfig, userId);
  }

  /**
   * Delete a provider
   */
  async delete(id: string): Promise<void> {
    return deleteEmailProvider(this.prisma, id);
  }

  /**
   * Find a provider by ID
   */
  async findById(id: string): Promise<EmailProvider | null> {
    return getEmailProviderById(this.prisma, id);
  }

  /**
   * Find the default provider for a workspace
   */
  async findDefault(workspaceId?: string): Promise<EmailProvider | null> {
    return getDefaultEmailProvider(this.prisma, workspaceId);
  }

  /**
   * Find the first active provider (fallback when no default)
   */
  async findFirstActive(workspaceId?: string): Promise<EmailProvider | null> {
    return getFirstActiveEmailProvider(this.prisma, workspaceId);
  }

  /**
   * List all providers for a workspace
   */
  async list(workspaceId?: string): Promise<EmailProvider[]> {
    return listEmailProviders(this.prisma, workspaceId);
  }

  /**
   * List active providers only
   */
  async listActive(workspaceId?: string): Promise<EmailProvider[]> {
    return listActiveEmailProviders(this.prisma, workspaceId);
  }

  /**
   * Set a provider as the default
   */
  async setDefault(id: string): Promise<EmailProvider> {
    return setDefaultEmailProvider(this.prisma, id);
  }

  /**
   * Increment the emails sent counter
   */
  async incrementEmailsSent(id: string): Promise<void> {
    return dbIncrementEmailsSent(this.prisma, id);
  }

  // ===== Encryption Operations (email package logic) =====

  /**
   * Get decrypted config for a provider
   */
  getDecryptedConfig<T extends Record<string, unknown>>(provider: EmailProvider): T {
    return decryptConfig<T>(provider.config);
  }
}
