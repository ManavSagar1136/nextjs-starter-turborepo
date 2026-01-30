/**
 * @buildbase/email - Health Check
 * Verify email service configuration and connectivity
 */

import type { PrismaClient } from "@buildbase/database";
import { EmailFactory } from "../factory/email.factory.js";
import { EmailQueue } from "../queue/queue.service.js";

/**
 * Health status for a component
 */
export interface ComponentHealth {
  status: "healthy" | "degraded" | "unhealthy";
  message?: string;
  latencyMs?: number;
}

/**
 * Overall health check result
 */
export interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: Date;
  components: {
    database: ComponentHealth;
    defaultProvider: ComponentHealth;
    queue: ComponentHealth;
  };
  providers: Array<{
    id: string;
    name: string;
    type: string;
    status: ComponentHealth;
  }>;
}

/**
 * Perform a comprehensive health check
 */
export async function healthCheck(prisma: PrismaClient): Promise<HealthCheckResult> {
  const timestamp = new Date();
  const components: HealthCheckResult["components"] = {
    database: { status: "unhealthy" },
    defaultProvider: { status: "unhealthy" },
    queue: { status: "unhealthy" },
  };
  const providers: HealthCheckResult["providers"] = [];

  // Check database connection
  try {
    const start = Date.now();
    // Use a simple query that works with any Prisma client
    (await (prisma as { $runCommandRaw?: (cmd: object) => Promise<unknown> }).$runCommandRaw?.({ ping: 1 })) ??
      prisma.emailProvider.count();
    components.database = {
      status: "healthy",
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    components.database = {
      status: "unhealthy",
      message: error instanceof Error ? error.message : "Database connection failed",
    };
  }

  // Check if EmailFactory is initialized
  if (!EmailFactory.isInitialized()) {
    components.defaultProvider = {
      status: "unhealthy",
      message: "EmailService not initialized",
    };
  } else {
    // Check default provider
    try {
      const factory = EmailFactory.getInstance();
      const start = Date.now();
      const provider = await factory.getProvider();

      components.defaultProvider = {
        status: "healthy",
        message: `Using ${provider.name} (${provider.type})`,
        latencyMs: Date.now() - start,
      };

      // Test provider connection
      const testResult = await provider.testConnection();
      if (!testResult.success) {
        components.defaultProvider = {
          status: "degraded",
          message: `Provider ${provider.name} test failed: ${testResult.error}`,
        };
      }
    } catch (error) {
      components.defaultProvider = {
        status: "unhealthy",
        message: error instanceof Error ? error.message : "Failed to get default provider",
      };
    }

    // List all providers and check their status
    try {
      const factory = EmailFactory.getInstance();
      const providerService = factory.getProviderService();
      const allProviders = await providerService.list();

      for (const p of allProviders) {
        try {
          const instance = await factory.getProvider(p.id);
          const testResult = await instance.testConnection();

          providers.push({
            id: p.id,
            name: p.name,
            type: p.type,
            status: {
              status: testResult.success ? "healthy" : "degraded",
              message: testResult.error,
            },
          });
        } catch (error) {
          providers.push({
            id: p.id,
            name: p.name,
            type: p.type,
            status: {
              status: "unhealthy",
              message: error instanceof Error ? error.message : "Failed to test provider",
            },
          });
        }
      }
    } catch {
      // Non-critical - continue without provider list
    }
  }

  // Check queue
  if (EmailQueue.configured) {
    components.queue = {
      status: "healthy",
      message: "QStash configured",
    };
  } else {
    components.queue = {
      status: "degraded",
      message: "Queue not configured (optional)",
    };
  }

  // Calculate overall status
  const statuses = [components.database.status, components.defaultProvider.status];

  let overallStatus: HealthCheckResult["status"] = "healthy";
  if (statuses.includes("unhealthy")) {
    overallStatus = "unhealthy";
  } else if (statuses.includes("degraded")) {
    overallStatus = "degraded";
  }

  return {
    status: overallStatus,
    timestamp,
    components,
    providers,
  };
}

/**
 * Quick health check (just verifies initialization)
 */
export function quickHealthCheck(): {
  initialized: boolean;
  queueConfigured: boolean;
} {
  return {
    initialized: EmailFactory.isInitialized(),
    queueConfigured: EmailQueue.configured,
  };
}

/**
 * Send a test email to verify configuration
 * Note: Test emails have tracking disabled to avoid polluting metrics
 */
export async function sendTestEmail(
  to: string,
  providerId?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!EmailFactory.isInitialized()) {
    return { success: false, error: "EmailService not initialized" };
  }

  try {
    const factory = EmailFactory.getInstance();
    const provider = await factory.getProvider(providerId);

    // Use provider.send directly with disableTracking for test emails
    // This avoids polluting tracking metrics with test data
    const result = await provider.send({
      to,
      subject: "Test Email from @buildbase/email",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">✅ Email Test Successful</h1>
          <p>This is a test email from your <strong>@buildbase/email</strong> package.</p>
          <p style="color: #666; font-size: 14px;">
            Sent at: ${new Date().toISOString()}<br>
            Provider: ${provider.name} (${provider.type})
          </p>
        </div>
      `,
      text: `Email Test Successful\n\nThis is a test email from your @buildbase/email package.\n\nSent at: ${new Date().toISOString()}\nProvider: ${provider.name} (${provider.type})`,
      disableTracking: true, // Don't track test emails
    });

    return {
      success: result.success,
      messageId: result.messageId,
      error: result.errors?.join(", "),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
