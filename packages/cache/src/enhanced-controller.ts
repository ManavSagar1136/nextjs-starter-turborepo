/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CacheService } from "./service";
import type { EnhancedCacheOptions, EnhancedCacheResult, Logger, RateLimitResult } from "./types";
import { CacheVersioning } from "./versioning";
import { UpstashRateLimiter } from "./rate-limiter";

export class EnhancedCacheController {
  private cacheService: CacheService;
  private logger: Logger;
  private rateLimiter?: UpstashRateLimiter;
  private defaultOptions: EnhancedCacheOptions = {
    enableCache: true,
    enableRateLimit: false,
    cacheStrategy: "dynamic",
    enableFallback: true,
    fallbackTTL: 300, // 5 minutes
    versioned: true,
  };

  constructor(cacheService: CacheService, logger: Logger, rateLimiter?: UpstashRateLimiter) {
    this.cacheService = cacheService;
    this.logger = logger;
    this.rateLimiter = rateLimiter;
  }

  /**
   * Enhanced cache get with automatic fallback
   */
  async get<T>(key: string, options: EnhancedCacheOptions = {}): Promise<EnhancedCacheResult<T | null>> {
    const finalOptions = { ...this.defaultOptions, ...options };

    // Use versioned key if enabled
    const cacheKey = finalOptions.versioned ? CacheVersioning.createVersionedKey(key) : key;

    try {
      // Try Redis first
      const redisResult = await this.cacheService.get<T>(cacheKey);

      if (redisResult.cached && redisResult.data !== null) {
        return {
          data: redisResult.data,
          cached: true,
          source: "redis",
          ttl: redisResult.ttl,
          rateLimited: false,
        };
      }

      // Try fallback cache if enabled and Redis didn't have the data
      if (finalOptions.enableFallback) {
        // Fallback is handled internally by CacheService
        // This is just for reporting the source
        return {
          data: null,
          cached: false,
          source: "fresh",
          rateLimited: false,
        };
      }

      return {
        data: null,
        cached: false,
        source: "fresh",
        rateLimited: false,
      };
    } catch (error) {
      this.logger.error({
        tag: "ENHANCED_CACHE",
        msg: "Enhanced cache get error:",
        error,
      });

      // Try fallback cache on error
      if (finalOptions.enableFallback) {
        try {
          const fallbackResult = await this.cacheService.get<T>(cacheKey);
          if (fallbackResult.cached && fallbackResult.data !== null) {
            return {
              data: fallbackResult.data,
              cached: true,
              source: "fallback",
              ttl: fallbackResult.ttl,
              rateLimited: false,
            };
          }
        } catch (fallbackError) {
          this.logger.error({
            tag: "ENHANCED_CACHE",
            msg: "Fallback cache get error:",
            error: fallbackError,
          });
        }
      }

      return {
        data: null,
        cached: false,
        source: "fresh",
        rateLimited: false,
      };
    }
  }

  /**
   * Enhanced cache set with automatic fallback
   */
  async set<T>(key: string, value: T, options: EnhancedCacheOptions = {}): Promise<void> {
    const finalOptions = { ...this.defaultOptions, ...options };

    // Use versioned key if enabled
    const cacheKey = finalOptions.versioned ? CacheVersioning.createVersionedKey(key) : key;

    try {
      await this.cacheService.set(cacheKey, value, {
        ttl: options.ttl,
        strategy: finalOptions.cacheStrategy || options.strategy,
        compress: options.compress,
      });
    } catch (error) {
      this.logger.error({
        tag: "ENHANCED_CACHE",
        msg: "Enhanced cache set error:",
        error,
      });
      // Error is already handled by CacheService with fallback
    }
  }

  /**
   * Cache wrapper - automatically caches expensive operations
   */
  async withCache<T>(
    key: string,
    fn: () => Promise<T>,
    options: EnhancedCacheOptions = {}
  ): Promise<EnhancedCacheResult<T>> {
    const finalOptions = { ...this.defaultOptions, ...options };

    // Check cache first
    if (finalOptions.enableCache !== false) {
      const cached = await this.get<T>(key, finalOptions);
      if (cached.cached && cached.data !== null) {
        return cached as EnhancedCacheResult<T>;
      }
    }

    // Execute function
    const data = await fn();

    // Cache the result
    if (finalOptions.enableCache !== false) {
      await this.set(key, data, finalOptions);
    }

    return {
      data,
      cached: false,
      source: "fresh",
      rateLimited: false,
    };
  }

  /**
   * Cache with rate limiting
   */
  async withRateLimit<T>(
    identifier: string,
    fn: () => Promise<T>,
    rateLimitConfig?: {
      windowMs: number;
      maxRequests: number;
    }
  ): Promise<EnhancedCacheResult<T> & { rateLimitInfo?: RateLimitResult }> {
    let rateLimitResult: RateLimitResult | undefined;

    // Check rate limit if enabled
    if (this.rateLimiter && rateLimitConfig) {
      rateLimitResult = await this.rateLimiter.checkRateLimit(identifier, {
        windowMs: rateLimitConfig.windowMs,
        maxRequests: rateLimitConfig.maxRequests,
      });

      if (!rateLimitResult.success) {
        return {
          data: null as any,
          cached: false,
          source: "fresh",
          rateLimited: true,
          rateLimitInfo: rateLimitResult,
        };
      }
    }

    // Execute function
    const data = await fn();

    return {
      data,
      cached: false,
      source: "fresh",
      rateLimited: false,
      rateLimitInfo: rateLimitResult,
    };
  }

  /**
   * Health check for both Redis and fallback
   */
  async healthCheck(): Promise<{
    redis: boolean;
    fallback: boolean;
    latency?: number;
  }> {
    return await this.cacheService.healthCheck();
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<void> {
    try {
      const keys = await this.cacheService.keys("*");
      if (keys.length > 0) {
        await this.cacheService.deleteMany(keys);
      }
    } catch (error) {
      this.logger.error({
        tag: "ENHANCED_CACHE",
        msg: "Error clearing all cache:",
        error,
      });
    }
  }

  /**
   * Invalidate by pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      await this.cacheService.deletePattern(pattern);
    } catch (error) {
      this.logger.error({
        tag: "ENHANCED_CACHE",
        msg: "Error invalidating pattern:",
        error,
      });
    }
  }
}
