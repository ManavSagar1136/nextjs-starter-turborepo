/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CacheService } from "./service";
import type { Logger } from "./types";
import { CacheVersioning } from "./versioning";

export interface MaintenanceOptions {
  cleanupExpired?: boolean;
  migrateVersions?: boolean;
  optimizeMemory?: boolean;
  clearFallback?: boolean;
  maxAge?: number; // in seconds
}

export interface MaintenanceResult {
  cleanedKeys: number;
  migratedKeys: number;
  optimizedMemory: boolean;
  errors: string[];
  duration: number;
}

export class CacheMaintenance {
  private static readonly DEFAULT_MAX_AGE = 24 * 60 * 60; // 24 hours

  /**
   * Run comprehensive cache maintenance
   */
  static async runMaintenance(
    cacheService: CacheService,
    logger: Logger,
    options: MaintenanceOptions = {}
  ): Promise<MaintenanceResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let cleanedKeys = 0;
    let migratedKeys = 0;

    try {
      // Clean up expired keys
      if (options.cleanupExpired !== false) {
        cleanedKeys = await this.cleanupExpiredKeys(cacheService, logger, options.maxAge);
      }

      // Migrate old cache versions
      if (options.migrateVersions !== false) {
        migratedKeys = await this.migrateOldVersions(cacheService, logger);
      }

      // Optimize memory usage
      if (options.optimizeMemory !== false) {
        await this.optimizeMemoryUsage(cacheService, logger);
      }

      // Clear fallback cache (optional, usually not needed)
      if (options.clearFallback === true) {
        await this.clearFallbackCache(cacheService, logger);
      }
    } catch (error: any) {
      errors.push(`Maintenance error: ${error.message || error}`);
      logger.error({
        tag: "CACHE_MAINTENANCE",
        msg: "Maintenance error:",
        error,
      });
    }

    const duration = Date.now() - startTime;

    // Record maintenance metrics
    await this.recordMaintenanceMetrics(cacheService, logger, {
      cleanedKeys,
      migratedKeys,
      duration,
      errors: errors.length,
    });

    logger.info({
      tag: "CACHE_MAINTENANCE",
      msg: "✅ Cache maintenance completed",
      data: {
        cleanedKeys,
        migratedKeys,
        duration,
        errors: errors.length,
      },
    });

    return {
      cleanedKeys,
      migratedKeys,
      optimizedMemory: options.optimizeMemory !== false,
      errors,
      duration,
    };
  }

  /**
   * Clean up expired cache keys
   */
  private static async cleanupExpiredKeys(
    cacheService: CacheService,
    logger: Logger,
    maxAge?: number
  ): Promise<number> {
    try {
      const maxAgeMs = (maxAge || this.DEFAULT_MAX_AGE) * 1000;
      const cutoffTime = Date.now() - maxAgeMs;
      let cleanedCount = 0;

      // Get all keys
      const keys = await cacheService.keys("*");

      logger.info({
        tag: "CACHE_MAINTENANCE",
        msg: `Checking ${keys.length} keys for expiration`,
      });

      // Check each key's TTL and remove if expired
      for (const key of keys) {
        try {
          const result = await cacheService.get(key);
          if (!result.cached) {
            // Key doesn't exist or expired, skip
            continue;
          }

          // Check if data has timestamp
          const data = result.data as any;
          if (data && typeof data === "object" && data.timestamp) {
            if (data.timestamp < cutoffTime) {
              await cacheService.delete(key);
              cleanedCount++;
            }
          }
        } catch (error) {
          // Key might be invalid, skip
          continue;
        }
      }

      logger.info({
        tag: "CACHE_MAINTENANCE",
        msg: `Cleaned up ${cleanedCount} expired keys`,
      });

      return cleanedCount;
    } catch (error) {
      logger.error({
        tag: "CACHE_MAINTENANCE",
        msg: "Error cleaning expired keys:",
        error,
      });
      return 0;
    }
  }

  /**
   * Migrate old cache versions
   */
  private static async migrateOldVersions(cacheService: CacheService, logger: Logger): Promise<number> {
    try {
      const currentVersion = CacheVersioning.getCurrentVersion();
      let migratedCount = 0;

      // Get all keys
      const keys = await cacheService.keys("*");

      for (const key of keys) {
        try {
          const versionedKey = CacheVersioning.extractVersion(key);
          if (versionedKey && versionedKey.version !== currentVersion) {
            // Get old data
            const result = await cacheService.get(key);
            if (result.cached && result.data) {
              // Create new versioned key
              const newKey = CacheVersioning.createVersionedKey(versionedKey.originalKey);
              await cacheService.set(newKey, result.data, { ttl: result.ttl || 300 });

              // Delete old key
              await cacheService.delete(key);
              migratedCount++;
            }
          }
        } catch (error) {
          // Skip invalid keys
          continue;
        }
      }

      logger.info({
        tag: "CACHE_MAINTENANCE",
        msg: `Migrated ${migratedCount} keys to current version`,
      });

      return migratedCount;
    } catch (error) {
      logger.error({
        tag: "CACHE_MAINTENANCE",
        msg: "Error migrating versions:",
        error,
      });
      return 0;
    }
  }

  /**
   * Optimize memory usage
   */
  private static async optimizeMemoryUsage(cacheService: CacheService, logger: Logger): Promise<void> {
    try {
      // Get statistics
      const stats = await cacheService.getStats();

      logger.info({
        tag: "CACHE_MAINTENANCE",
        msg: "Memory optimization check",
        data: stats,
      });

      // If we have too many keys, suggest cleanup
      if (stats.totalKeys > 100000) {
        logger.warn({
          tag: "CACHE_MAINTENANCE",
          msg: `High number of cache keys: ${stats.totalKeys}. Consider running cleanup.`,
        });
      }

      // Note: Upstash Redis manages memory automatically
      // This is mainly for logging and monitoring
    } catch (error) {
      logger.error({
        tag: "CACHE_MAINTENANCE",
        msg: "Error optimizing memory:",
        error,
      });
    }
  }

  /**
   * Clear fallback cache
   */
  private static async clearFallbackCache(cacheService: CacheService, logger: Logger): Promise<void> {
    try {
      // Note: This would require access to fallback cache
      // For now, we'll just log
      logger.info({
        tag: "CACHE_MAINTENANCE",
        msg: "Fallback cache clear requested (not implemented - fallback cache is in-memory only)",
      });
    } catch (error) {
      logger.error({
        tag: "CACHE_MAINTENANCE",
        msg: "Error clearing fallback cache:",
        error,
      });
    }
  }

  /**
   * Record maintenance metrics
   */
  private static async recordMaintenanceMetrics(
    cacheService: CacheService,
    logger: Logger,
    metrics: {
      cleanedKeys: number;
      migratedKeys: number;
      duration: number;
      errors: number;
    }
  ): Promise<void> {
    try {
      // Store maintenance metrics in cache for tracking
      const metricsKey = "cache:maintenance:metrics";
      const existingMetrics = await cacheService.get<Array<typeof metrics & { timestamp: number }>>(metricsKey);

      const metricsArray = existingMetrics.cached ? existingMetrics.data || [] : [];
      metricsArray.push({
        ...metrics,
        timestamp: Date.now(),
      });

      // Keep only last 100 maintenance runs
      if (metricsArray.length > 100) {
        metricsArray.shift();
      }

      await cacheService.set(metricsKey, metricsArray, { ttl: 7 * 24 * 60 * 60 }); // 7 days
    } catch (error) {
      logger.error({
        tag: "CACHE_MAINTENANCE",
        msg: "Record maintenance metrics error:",
        error,
      });
    }
  }

  /**
   * Schedule periodic maintenance
   */
  static scheduleMaintenance(
    cacheService: CacheService,
    logger: Logger,
    intervalMs: number = 60 * 60 * 1000 // 1 hour
  ): NodeJS.Timeout {
    return setInterval(async () => {
      await this.runMaintenance(cacheService, logger);
    }, intervalMs);
  }
}
