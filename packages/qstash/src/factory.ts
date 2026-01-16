import type { QStashConfig } from "./config";
import { createQStashConfig } from "./config";
import { QStashClient } from "./client";
import { QStashReceiver } from "./receiver";
import type { Logger } from "./types";
import { noOpLogger } from "./types";

export interface QStashFactoryOptions {
  config?: QStashConfig;
  logger?: Logger;
  qstashToken?: string;
  qstashUrl?: string;
  currentSigningKey?: string;
  nextSigningKey?: string;
}

/**
 * Factory function to create QStash instances with proper dependency injection
 * This follows Vercel best practices by making dependencies explicit
 */
export const createQStashFactory = (options: QStashFactoryOptions = {}) => {
  const config =
    options.config ||
    createQStashConfig({
      qstashToken: options.qstashToken,
      qstashUrl: options.qstashUrl,
      currentSigningKey: options.currentSigningKey,
      nextSigningKey: options.nextSigningKey,
    });
  const logger = options.logger || noOpLogger;

  // Create client
  const client = new QStashClient(config, logger);

  // Create receiver
  const receiver = new QStashReceiver(config, logger);

  return {
    config,
    logger,
    client,
    receiver,
  };
};

/**
 * Default factory instance (uses environment variables)
 * For Vercel, this will work with environment variables set in the dashboard
 */
export const defaultQStashFactory = createQStashFactory();

// Export individual instances for convenience
export const { client: defaultQStashClient, receiver: defaultQStashReceiver } = defaultQStashFactory;
