/**
 * New Relic integration utilities for @buildbase/logger
 *
 * This module provides utilities for integrating with New Relic's
 * APM and log forwarding capabilities.
 *
 * @example
 * ```ts
 * // In instrumentation.ts (Next.js)
 * import { initNewRelic } from '@buildbase/logger/newrelic';
 * import { env } from '@buildbase/env';
 *
 * export async function register() {
 *   if (process.env.NEXT_RUNTIME === 'nodejs') {
 *     await initNewRelic({
 *       appName: 'my-app',
 *       licenseKey: env.NEW_RELIC_LICENSE_KEY,
 *     });
 *   }
 * }
 * ```
 */

import { env } from "@buildbase/env";

export interface NewRelicInitConfig {
  /** Application name in New Relic */
  appName: string;
  /** New Relic license key */
  licenseKey?: string;
  /** Enable distributed tracing (default: true) */
  distributedTracing?: boolean;
  /** Enable log forwarding (default: true) */
  logForwarding?: boolean;
  /** Log level for agent logs (default: 'info') */
  logLevel?: "trace" | "debug" | "info" | "warn" | "error";
}

/**
 * Check if New Relic is available and enabled
 */
export const isNewRelicEnabled = (): boolean => {
  return env.NEW_RELIC_ENABLED === "true" && !!env.NEW_RELIC_LICENSE_KEY;
};

/**
 * Get the current New Relic transaction (if available)
 * Useful for adding custom attributes to traces
 */
export const getTransaction = (): unknown | null => {
  try {
    // Dynamic import to avoid errors when newrelic is not installed
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const newrelic = require("newrelic");
    return newrelic.getTransaction();
  } catch {
    return null;
  }
};

/**
 * Add custom attribute to the current New Relic transaction
 */
export const addTransactionAttribute = (key: string, value: string | number | boolean): void => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const newrelic = require("newrelic");
    newrelic.addCustomAttribute(key, value);
  } catch {
    // New Relic not available, silently ignore
  }
};

/**
 * Add multiple custom attributes to the current New Relic transaction
 */
export const addTransactionAttributes = (attributes: Record<string, string | number | boolean>): void => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const newrelic = require("newrelic");
    newrelic.addCustomAttributes(attributes);
  } catch {
    // New Relic not available, silently ignore
  }
};

/**
 * Get linking metadata for log correlation
 * Returns trace.id and span.id if available
 */
export const getLinkingMetadata = (): Record<string, string> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const newrelic = require("newrelic");
    return newrelic.getLinkingMetadata() || {};
  } catch {
    return {};
  }
};

/**
 * Record a custom event in New Relic
 */
export const recordCustomEvent = (eventType: string, attributes: Record<string, string | number | boolean>): void => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const newrelic = require("newrelic");
    newrelic.recordCustomEvent(eventType, attributes);
  } catch {
    // New Relic not available, silently ignore
  }
};

/**
 * Notice an error in New Relic
 */
export const noticeError = (error: Error, customAttributes?: Record<string, string | number | boolean>): void => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const newrelic = require("newrelic");
    newrelic.noticeError(error, customAttributes);
  } catch {
    // New Relic not available, silently ignore
  }
};

/**
 * Set the name of the current transaction
 */
export const setTransactionName = (name: string): void => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const newrelic = require("newrelic");
    newrelic.setTransactionName(name);
  } catch {
    // New Relic not available, silently ignore
  }
};

/**
 * Create a background transaction wrapper
 * Useful for cron jobs, queue processors, etc.
 */
export const startBackgroundTransaction = <T>(
  name: string,
  group: string,
  handler: () => T | Promise<T>
): Promise<T> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const newrelic = require("newrelic");
    return new Promise((resolve, reject) => {
      newrelic.startBackgroundTransaction(name, group, async () => {
        try {
          const result = await handler();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  } catch {
    // New Relic not available, just run the handler
    return Promise.resolve(handler());
  }
};

/**
 * Generate New Relic configuration for newrelic.js
 * Use this to create a consistent config file
 */
export const generateNewRelicConfig = (config: NewRelicInitConfig): Record<string, unknown> => {
  return {
    app_name: [config.appName],
    license_key: config.licenseKey || env.NEW_RELIC_LICENSE_KEY,
    distributed_tracing: {
      enabled: config.distributedTracing ?? true,
    },
    logging: {
      level: config.logLevel ?? "info",
    },
    application_logging: {
      enabled: true,
      forwarding: {
        enabled: config.logForwarding ?? true,
        max_samples_stored: 10000,
      },
      metrics: {
        enabled: true,
      },
      local_decorating: {
        enabled: false,
      },
    },
    allow_all_headers: true,
    attributes: {
      exclude: [
        "request.headers.cookie",
        "request.headers.authorization",
        "request.headers.proxyAuthorization",
        "request.headers.setCookie*",
        "request.headers.x*",
        "response.headers.cookie",
        "response.headers.authorization",
        "response.headers.proxyAuthorization",
        "response.headers.setCookie*",
        "response.headers.x*",
      ],
    },
  };
};
