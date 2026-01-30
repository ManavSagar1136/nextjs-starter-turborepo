/**
 * @buildbase/email - Email Factory
 * Factory for creating email provider instances from database config
 */

import type { PrismaClient, EmailProvider as DbEmailProvider } from "@buildbase/database";
import type {
  EmailProviderInstance,
  ProviderType,
  SmtpConfig,
  ResendConfig,
  MailgunConfig,
  SendGridConfig,
  SesConfig,
} from "../core/types.js";
import { decryptConfig } from "../core/encryption.js";
import { NoDefaultProviderError, ProviderNotFoundError } from "../core/errors.js";
import { ProviderService } from "../service/provider.service.js";
import { ConsoleProvider } from "../providers/console.provider.js";
import { NodemailerProvider } from "../providers/nodemailer.provider.js";
import { ResendProvider } from "../providers/resend.provider.js";
import { MailgunProvider } from "../providers/mailgun.provider.js";
import { SendGridProvider } from "../providers/sendgrid.provider.js";
import { SesProvider } from "../providers/ses.provider.js";

/**
 * Factory for creating and caching email provider instances
 */
export class EmailFactory {
  private static instance: EmailFactory | null = null;
  private providerCache = new Map<string, EmailProviderInstance>();
  private providerService: ProviderService;

  private constructor(prisma: PrismaClient) {
    this.providerService = new ProviderService(prisma);
  }

  /**
   * Initialize the factory with a Prisma client
   */
  static initialize(prisma: PrismaClient): EmailFactory {
    if (!this.instance) {
      this.instance = new EmailFactory(prisma);
    }
    return this.instance;
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): EmailFactory {
    if (!this.instance) {
      throw new Error("EmailFactory not initialized. Call EmailFactory.initialize(prisma) first.");
    }
    return this.instance;
  }

  /**
   * Check if factory is initialized
   */
  static isInitialized(): boolean {
    return this.instance !== null;
  }

  /**
   * Get a provider instance by ID, or the default provider
   */
  async getProvider(providerId?: string, workspaceId?: string): Promise<EmailProviderInstance> {
    // Check cache first
    const cacheKey = providerId ?? `default:${workspaceId ?? "global"}`;
    if (this.providerCache.has(cacheKey)) {
      return this.providerCache.get(cacheKey)!;
    }

    // Get from database
    let dbProvider: DbEmailProvider | null;

    if (providerId) {
      dbProvider = await this.providerService.findById(providerId);
      if (!dbProvider) {
        throw new ProviderNotFoundError(providerId);
      }
    } else {
      // Try to find default provider
      dbProvider = await this.providerService.findDefault(workspaceId);

      // Fallback to first active provider
      if (!dbProvider) {
        dbProvider = await this.providerService.findFirstActive(workspaceId);
      }

      // If still no provider, use console provider for dev
      if (!dbProvider) {
        const consoleProvider = new ConsoleProvider();
        console.warn("⚠️  No email provider configured. Using Console provider (emails will be logged, not sent).");
        return consoleProvider;
      }
    }

    // Create provider instance
    const instance = await this.createFromDbRecord(dbProvider);
    this.providerCache.set(cacheKey, instance);

    return instance;
  }

  /**
   * Get the default provider (throws if none configured)
   */
  async getDefaultProvider(workspaceId?: string): Promise<EmailProviderInstance> {
    const dbProvider = await this.providerService.findDefault(workspaceId);

    if (!dbProvider) {
      throw new NoDefaultProviderError();
    }

    const cacheKey = `default:${workspaceId ?? "global"}`;
    if (this.providerCache.has(cacheKey)) {
      return this.providerCache.get(cacheKey)!;
    }

    const instance = await this.createFromDbRecord(dbProvider);
    this.providerCache.set(cacheKey, instance);

    return instance;
  }

  /**
   * Create a provider instance from a database record
   */
  async createFromDbRecord(dbProvider: DbEmailProvider): Promise<EmailProviderInstance> {
    const type = dbProvider.type as ProviderType;

    switch (type) {
      case "CONSOLE":
        return new ConsoleProvider({
          id: dbProvider.id,
          name: dbProvider.name,
          type: "CONSOLE",
          fromName: dbProvider.fromName,
          fromEmail: dbProvider.fromEmail,
          replyTo: dbProvider.replyTo,
        });

      case "SMTP": {
        const config = decryptConfig<SmtpConfig>(dbProvider.config);
        return new NodemailerProvider(
          {
            id: dbProvider.id,
            name: dbProvider.name,
            type: "SMTP",
            fromName: dbProvider.fromName,
            fromEmail: dbProvider.fromEmail,
            replyTo: dbProvider.replyTo,
          },
          config
        );
      }

      case "RESEND": {
        const config = decryptConfig<ResendConfig>(dbProvider.config);
        return new ResendProvider(
          {
            id: dbProvider.id,
            name: dbProvider.name,
            type: "RESEND",
            fromName: dbProvider.fromName,
            fromEmail: dbProvider.fromEmail,
            replyTo: dbProvider.replyTo,
          },
          config
        );
      }

      case "MAILGUN": {
        const config = decryptConfig<MailgunConfig>(dbProvider.config);
        return new MailgunProvider(
          {
            id: dbProvider.id,
            name: dbProvider.name,
            type: "MAILGUN",
            fromName: dbProvider.fromName,
            fromEmail: dbProvider.fromEmail,
            replyTo: dbProvider.replyTo,
          },
          config
        );
      }

      case "SENDGRID": {
        const config = decryptConfig<SendGridConfig>(dbProvider.config);
        return new SendGridProvider(
          {
            id: dbProvider.id,
            name: dbProvider.name,
            type: "SENDGRID",
            fromName: dbProvider.fromName,
            fromEmail: dbProvider.fromEmail,
            replyTo: dbProvider.replyTo,
          },
          config
        );
      }

      case "SES": {
        const config = decryptConfig<SesConfig>(dbProvider.config);
        return new SesProvider(
          {
            id: dbProvider.id,
            name: dbProvider.name,
            type: "SES",
            fromName: dbProvider.fromName,
            fromEmail: dbProvider.fromEmail,
            replyTo: dbProvider.replyTo,
          },
          config
        );
      }

      default:
        throw new Error(`Unknown provider type: ${type}`);
    }
  }

  /**
   * Invalidate cache for a specific provider or all providers
   */
  invalidateCache(providerId?: string): void {
    if (providerId) {
      this.providerCache.delete(providerId);
      // Also clear from default caches
      for (const key of this.providerCache.keys()) {
        if (key.startsWith("default:")) {
          this.providerCache.delete(key);
        }
      }
    } else {
      this.providerCache.clear();
    }
  }

  /**
   * Get the provider service for CRUD operations
   */
  getProviderService(): ProviderService {
    return this.providerService;
  }
}
