/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CacheConfig } from "./config";
import { createCacheConfig, CACHE_CONFIG } from "./config";
import { FallbackCache } from "./fallback";
import { UpstashRateLimiter, RATE_LIMIT_CONFIGS } from "./rate-limiter";
import { CacheService } from "./service";
import type { Logger } from "./types";

export interface CacheFactoryOptions {
  config?: CacheConfig;
  logger?: Logger;
  redisUrl?: string;
  redisToken?: string;
}

/**
 * Factory function to create cache instances with proper dependency injection
 * This follows Vercel best practices by making dependencies explicit
 */
export const createCacheFactory = (options: CacheFactoryOptions = {}) => {
  const config =
    options.config ||
    createCacheConfig({
      redisUrl: options.redisUrl,
      redisToken: options.redisToken,
    });
  const logger = options.logger || {
    info: () => {},
    warn: () => {},
    error: () => {},
  };

  // Create fallback cache
  const fallbackCache = new FallbackCache({ logger });

  // Create cache service
  const cacheService = new CacheService(config, logger, fallbackCache);

  // Create rate limiter
  const rateLimiter = new UpstashRateLimiter(config, logger);

  return {
    config,
    logger,
    fallbackCache,
    cacheService,
    rateLimiter,
    RATE_LIMIT_CONFIGS,
  };
};

/**
 * Default factory instance (uses environment variables)
 * For Vercel, this will work with environment variables set in the dashboard
 */
export const defaultCacheFactory = createCacheFactory();

// Export individual instances for convenience
export const {
  cacheService: defaultCacheService,
  rateLimiter: defaultRateLimiter,
  fallbackCache: defaultFallbackCache,
} = defaultCacheFactory;
