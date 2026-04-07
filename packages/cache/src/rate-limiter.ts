import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import type { CacheConfig } from "./config";
import { CACHE_CONFIG } from "./config";
import type { Logger, RateLimitConfig, RateLimitResult } from "./types";

export class UpstashRateLimiter {
  private redis: Redis;
  private config: CacheConfig;
  private logger: Logger;

  constructor(config?: CacheConfig, logger?: Logger) {
    this.config = config || CACHE_CONFIG;
    this.logger = logger || {
      info: () => {},
      warn: () => {},
      error: () => {},
    };

    this.redis = new Redis({
      url: this.config.redis.url,
      token: this.config.redis.token,
    });
  }

  /**
   * Create a rate limiter instance
   */
  createRateLimiter(config: RateLimitConfig): Ratelimit {
    return new Ratelimit({
      redis: this.redis,
      limiter: Ratelimit.slidingWindow(config.maxRequests, `${config.windowMs} ms`),
      analytics: true,
      prefix: this.config.rateLimit.prefix,
    });
  }

  /**
   * Check rate limit for a specific identifier
   */
  async checkRateLimit(identifier: string, config: RateLimitConfig): Promise<RateLimitResult> {
    try {
      const rateLimiter = this.createRateLimiter(config);
      const result = await rateLimiter.limit(identifier);

      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
        retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
      };
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Rate limit check error:",
        data: {
          identifier,
          config,
        },
        error,
      });
      // On error, allow the request to proceed
      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        reset: Date.now() + config.windowMs,
      };
    }
  }

  /**
   * Check rate limit with default configuration
   */
  async checkDefaultRateLimit(identifier: string): Promise<RateLimitResult> {
    return this.checkRateLimit(identifier, {
      windowMs: this.config.rateLimit.windowMs,
      maxRequests: this.config.rateLimit.maxRequests,
    });
  }

  /**
   * Like checkRateLimit but throws on Redis/network errors instead of failing open.
   * Use this when you must deny requests under degraded conditions (e.g. API key auth).
   */
  async checkRateLimitStrict(identifier: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const rateLimiter = this.createRateLimiter(config);
    const result = await rateLimiter.limit(identifier); // intentionally not caught — caller handles
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
    };
  }

  /**
   * Get rate limit info without consuming a request
   */
  async getRateLimitInfo(identifier: string, config: RateLimitConfig): Promise<RateLimitResult> {
    try {
      const rateLimiter = this.createRateLimiter(config);
      const result = await rateLimiter.limit(identifier);

      return {
        success: true,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      };
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Rate limit info error:",
        data: {
          identifier,
          config,
        },
        error,
      });
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        reset: Date.now(),
      };
    }
  }

  /**
   * Reset rate limit for a specific identifier
   */
  async resetRateLimit(identifier: string): Promise<void> {
    try {
      const key = `${this.config.rateLimit.prefix}${identifier}`;
      await this.redis.del(key);
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Rate limit reset error:",
        data: {
          identifier,
        },
        error,
      });
    }
  }

  /**
   * Get rate limit statistics
   */
  async getRateLimitStats(): Promise<{
    totalIdentifiers: number;
    activeIdentifiers: number;
  }> {
    try {
      const keys = await this.redis.keys(`${this.config.rateLimit.prefix}*`);
      const now = Date.now();
      let activeCount = 0;

      // Check which rate limits are still active
      for (const key of keys) {
        const data = await this.redis.get(key);
        if (data) {
          try {
            const parsed = JSON.parse(data as string);
            if (parsed.reset > now) {
              activeCount++;
            }
          } catch {
            activeCount++;
          }
        }
      }

      return {
        totalIdentifiers: keys.length,
        activeIdentifiers: activeCount,
      };
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Rate limit stats error:",
        error,
      });
      return {
        totalIdentifiers: 0,
        activeIdentifiers: 0,
      };
    }
  }
}

// Predefined rate limit configurations
export const RATE_LIMIT_CONFIGS = {
  // Default rate limit
  DEFAULT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },

  // Strict rate limit
  STRICT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },

  // API rate limit
  API: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
  },

  // Email rate limit
  EMAIL: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
  },

  // Upload rate limit
  UPLOAD: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
  },

  // Authentication rate limit
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  },
} as const;
