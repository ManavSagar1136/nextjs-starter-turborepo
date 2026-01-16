/* eslint-disable @typescript-eslint/no-explicit-any */
import { Redis } from "@upstash/redis";

import type { CacheConfig } from "./config";
import { CACHE_CONFIG, CACHE_PATTERNS, generateCacheKey } from "./config";
import { FallbackCache } from "./fallback";
import type { CacheOptions, CacheResult, Logger } from "./types";

// Edge-compatible base64 encoding/decoding
const encodeBase64 = (str: string): string => {
  if (typeof btoa !== "undefined") {
    return btoa(str);
  }
  // Fallback for Node.js
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str).toString("base64");
  }
  throw new Error("No base64 encoding available");
};

const decodeBase64 = (str: string): string => {
  if (typeof atob !== "undefined") {
    return atob(str);
  }
  // Fallback for Node.js
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "base64").toString();
  }
  throw new Error("No base64 decoding available");
};

export class CacheService {
  private redis: Redis;
  private redisWithTimeout: Redis;
  private config: CacheConfig;
  private logger: Logger;
  private fallbackCache: FallbackCache;

  constructor(config?: CacheConfig, logger?: Logger, fallbackCache?: FallbackCache) {
    this.config = config || CACHE_CONFIG;
    this.logger = logger || {
      info: () => {},
      warn: () => {},
      error: () => {},
    };
    this.fallbackCache = fallbackCache || new FallbackCache({ logger: this.logger });

    const timeout = this.config.timeout?.default || 5000;

    // Standard Redis client
    this.redis = new Redis({
      url: this.config.redis.url,
      token: this.config.redis.token,
    });

    // Redis client with timeout for read operations
    this.redisWithTimeout = new Redis({
      url: this.config.redis.url,
      token: this.config.redis.token,
      signal: () => AbortSignal.timeout(timeout),
    });
  }

  /**
   * Retry helper with exponential backoff
   */
  private async retry<T>(operation: () => Promise<T>, operationName: string, useTimeout: boolean = false): Promise<T> {
    const maxAttempts = this.config.retry?.maxAttempts || 3;
    const baseDelay = this.config.retry?.baseDelay || 100;
    const maxDelay = this.config.retry?.maxDelay || 2000;
    const useBackoff = this.config.retry?.exponentialBackoff !== false;

    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;

        // Don't retry on timeout if using timeout client
        if (useTimeout && error.name === "AbortError") {
          throw error;
        }

        if (attempt < maxAttempts) {
          const delay = useBackoff ? Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay) : baseDelay;

          this.logger.warn({
            tag: "CACHE",
            msg: `${operationName} failed, retrying (attempt ${attempt}/${maxAttempts})`,
            data: { delay, error: error.message },
          });

          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    try {
      const { ttl, strategy = "dynamic", compress = false } = options;

      const finalTTL = ttl || this.config.strategies[strategy].ttl;

      let dataToStore: any = value;
      if (compress && typeof value === "string") {
        dataToStore = encodeBase64(value);
      }

      const cacheEntry = {
        data: dataToStore,
        timestamp: Date.now(),
        ttl: finalTTL,
        strategy,
        compressed: compress,
      };

      try {
        await this.redis.setex(key, finalTTL, JSON.stringify(cacheEntry));
      } catch (redisError) {
        this.logger.warn({
          tag: "CACHE",
          msg: "Redis set failed, using fallback cache:",
          error: redisError,
        });
        await this.fallbackCache.set(key, cacheEntry, Math.min(finalTTL, 300));
      }
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Cache set error:",
        error,
      });
    }
  }

  /**
   * Get a value from cache with timeout and retry support
   */
  async get<T>(key: string): Promise<CacheResult<T>> {
    try {
      const cached = await this.retry(() => this.redisWithTimeout.get(key), `get(${key})`, true);

      if (!cached) {
        const fallbackData = await this.fallbackCache.get<T>(key);
        if (fallbackData !== null) {
          return {
            data: fallbackData,
            cached: true,
            ttl: this.config.strategies.dynamic.ttl,
          };
        }
        return { data: null, cached: false };
      }

      let cacheEntry: any;

      if (typeof cached === "object" && cached !== null) {
        cacheEntry = cached;
      } else if (typeof cached === "string") {
        try {
          cacheEntry = JSON.parse(cached);
        } catch (parseError) {
          this.logger.warn({
            tag: "CACHE",
            msg: `Failed to parse cache entry for key`,
            data: { key },
            error: parseError,
          });
          return {
            data: cached as T,
            cached: true,
            ttl: this.config.strategies.dynamic.ttl,
          };
        }
      } else {
        return {
          data: cached as T,
          cached: true,
          ttl: this.config.strategies.dynamic.ttl,
        };
      }

      const now = Date.now();
      const expiryTime = cacheEntry.timestamp + cacheEntry.ttl * 1000;

      if (now > expiryTime) {
        await this.delete(key);
        return { data: null, cached: false };
      }

      let data = cacheEntry.data;
      if (cacheEntry.compressed && typeof data === "string") {
        try {
          data = decodeBase64(data);
        } catch (decompressError) {
          this.logger.warn({
            tag: "CACHE",
            msg: `Failed to decompress cache entry for key`,
            data: { key },
            error: decompressError,
          });
        }
      }

      return {
        data: data as T,
        cached: true,
        ttl: Math.ceil((expiryTime - now) / 1000),
      };
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Cache get error:",
        error,
      });
      try {
        const fallbackData = await this.fallbackCache.get<T>(key);
        if (fallbackData !== null) {
          return {
            data: fallbackData,
            cached: true,
            ttl: this.config.strategies.dynamic.ttl,
          };
        }
      } catch (fallbackError) {
        this.logger.error({
          tag: "CACHE",
          msg: "Fallback cache get error:",
          error: fallbackError,
        });
      }
      return { data: null, cached: false };
    }
  }

  /**
   * Health check for Redis and fallback cache
   */
  async healthCheck(): Promise<{
    redis: boolean;
    fallback: boolean;
    latency?: number;
    error?: string;
  }> {
    const startTime = Date.now();
    let redisHealth = false;
    let error: string | undefined;

    try {
      // Try to ping Redis
      await this.retry(() => this.redis.ping(), "healthCheck.ping()", false);
      redisHealth = true;
    } catch (err: any) {
      redisHealth = false;
      error = err.message || "Redis health check failed";
    }

    const latency = Date.now() - startTime;
    const fallbackHealth = this.fallbackCache !== null;

    return {
      redis: redisHealth,
      fallback: fallbackHealth,
      latency: redisHealth ? latency : undefined,
      error: redisHealth ? undefined : error,
    };
  }

  /**
   * Delete a specific key from cache
   */
  async delete(key: string): Promise<void> {
    try {
      try {
        await this.redis.del(key);
      } catch (redisError) {
        this.logger.warn({
          tag: "CACHE",
          msg: "Redis delete failed, deleting from fallback cache:",
          error: redisError,
        });
      }

      await this.fallbackCache.delete(key);
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Cache delete error:",
        error,
      });
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      this.logger.info({
        tag: "CACHE",
        msg: `Redis: Deleting pattern`,
        data: { pattern },
      });
      const keys = await this.redis.keys(pattern);
      this.logger.info({
        tag: "CACHE",
        msg: `Redis: Found ${keys.length} keys matching pattern`,
        data: { pattern, keys },
      });

      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.info({
          tag: "CACHE",
          msg: `Redis: Successfully deleted ${keys.length} keys`,
          data: { pattern, keys },
        });
      }
    } catch (error) {
      await this.fallbackCache.deletePattern(pattern);

      this.logger.error({
        tag: "CACHE",
        msg: "Cache delete pattern error:",
        error,
      });
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Cache exists error:",
        error,
      });
      const fallbackData = await this.fallbackCache.get(key);
      return fallbackData !== null;
    }
  }

  /**
   * Get multiple keys at once using pipeline for performance
   */
  async mget<T>(keys: string[]): Promise<Array<T | null>> {
    try {
      if (keys.length === 0) {
        return [];
      }

      const results = await this.retry(() => this.redisWithTimeout.mget(...keys), `mget(${keys.length} keys)`, true);
      const processedResults: Array<T | null> = [];

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const key = keys[i];
        if (!result) {
          if (key) {
            const fallbackResult = await this.fallbackCache.get<T>(key);
            processedResults.push(fallbackResult);
          } else {
            processedResults.push(null);
          }
        } else {
          try {
            const cacheEntry = JSON.parse(result as string);
            processedResults.push(cacheEntry.data as T);
          } catch {
            processedResults.push(result as T);
          }
        }
      }

      return processedResults;
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Cache mget error:",
        error,
      });
      const results = await Promise.all(keys.map(key => this.get<T>(key)));
      return results.map(result => result.data);
    }
  }

  /**
   * Set multiple key-value pairs at once using pipeline for performance
   */
  async mset<T>(
    keyValuePairs: Array<{ key: string; value: T; ttl?: number }>,
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      const { strategy = "dynamic", compress = false } = options;

      if (keyValuePairs.length === 0) {
        return;
      }

      // Use pipeline for bulk operations
      const pipeline = this.redis.pipeline();

      for (const { key, value, ttl } of keyValuePairs) {
        const finalTTL = ttl || this.config.strategies[strategy].ttl;

        let dataToStore: any = value;
        if (compress && typeof value === "string") {
          dataToStore = encodeBase64(value);
        }

        const cacheEntry = {
          data: dataToStore,
          timestamp: Date.now(),
          ttl: finalTTL,
          strategy,
          compressed: compress,
        };

        pipeline.setex(key, finalTTL, JSON.stringify(cacheEntry));
      }

      try {
        await pipeline.exec();
      } catch (redisError) {
        this.logger.warn({
          tag: "CACHE",
          msg: "Redis pipeline mset failed, using fallback cache:",
          error: redisError,
        });

        // Fallback to sequential set in fallback cache
        for (const { key, value, ttl } of keyValuePairs) {
          const finalTTL = ttl || this.config.strategies[strategy].ttl;
          const cacheEntry = {
            data: value,
            timestamp: Date.now(),
            ttl: finalTTL,
            strategy,
            compressed: compress,
          };
          await this.fallbackCache.set(key, cacheEntry, Math.min(finalTTL, 300));
        }
      }
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Cache mset error:",
        error,
      });
    }
  }

  /**
   * Increment a numeric value
   */
  async incr(key: string, amount: number = 1): Promise<number> {
    try {
      const result = await this.redis.incrby(key, amount);
      return result;
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Cache incr error:",
        error,
      });
      return await this.fallbackCache.incr(key, amount);
    }
  }

  /**
   * Decrement a numeric value
   */
  async decr(key: string, amount: number = 1): Promise<number> {
    try {
      const result = await this.redis.decrby(key, amount);
      return result;
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Cache decr error:",
        error,
      });
      return await this.fallbackCache.decr(key, amount);
    }
  }

  /**
   * Set a value only if it doesn't exist (NX - Not eXists)
   */
  async setnx<T>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
    try {
      const { ttl, strategy = "dynamic", compress = false } = options;
      const finalTTL = ttl || this.config.strategies[strategy].ttl;

      const cacheEntry = {
        data: value,
        timestamp: Date.now(),
        ttl: finalTTL,
        strategy,
        compressed: compress,
      };

      try {
        const result = await this.redis.set(key, JSON.stringify(cacheEntry), {
          nx: true,
          ex: finalTTL,
        });
        return result === "OK";
      } catch (redisError) {
        this.logger.warn({
          tag: "CACHE",
          msg: "Redis setnx failed, using fallback cache:",
          error: redisError,
        });
        return await this.fallbackCache.setnx(key, cacheEntry, finalTTL);
      }
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Cache setnx error:",
        error,
      });
      return false;
    }
  }

  /**
   * Set a value only if it exists (XX - eXists)
   */
  async setxx<T>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
    try {
      const { ttl, strategy = "dynamic", compress = false } = options;
      const finalTTL = ttl || this.config.strategies[strategy].ttl;

      const cacheEntry = {
        data: value,
        timestamp: Date.now(),
        ttl: finalTTL,
        strategy,
        compressed: compress,
      };

      try {
        const result = await this.redis.set(key, JSON.stringify(cacheEntry), {
          xx: true,
          ex: finalTTL,
        });
        return result === "OK";
      } catch (redisError) {
        this.logger.warn({
          tag: "CACHE",
          msg: "Redis setxx failed, using fallback cache:",
          error: redisError,
        });
        return await this.fallbackCache.setxx(key, cacheEntry, finalTTL);
      }
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Cache setxx error:",
        error,
      });
      return false;
    }
  }

  /**
   * Get the TTL (Time To Live) of a key
   */
  async ttl(key: string): Promise<number> {
    try {
      const result = await this.redis.ttl(key);
      if (result === -1) return -1;
      if (result === -2) return -2;
      return result;
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Cache ttl error:",
        error,
      });
      return await this.fallbackCache.ttl(key);
    }
  }

  /**
   * Set TTL for an existing key
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.redis.expire(key, ttl);
      return result === 1;
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Cache expire error:",
        error,
      });
      const fallbackData = await this.fallbackCache.get(key);
      if (fallbackData) {
        await this.fallbackCache.set(key, fallbackData, ttl);
        return true;
      }
      return false;
    }
  }

  /**
   * Get all keys matching a pattern
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      const result = await this.redis.keys(pattern);
      return result;
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Cache keys error:",
        error,
      });
      return await this.fallbackCache.keys(pattern);
    }
  }

  /**
   * Delete multiple keys using pipeline for performance
   */
  async del(...keys: string[]): Promise<number> {
    try {
      if (keys.length === 0) {
        return 0;
      }

      // Use pipeline for bulk delete
      const pipeline = this.redis.pipeline();
      keys.forEach(key => pipeline.del(key));

      const results = await pipeline.exec();
      const deletedCount = results.filter((result: any) => result !== null && result !== 0).length;

      // Also delete from fallback cache
      await Promise.all(keys.map(key => this.fallbackCache.delete(key)));

      return deletedCount;
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Cache del error:",
        error,
      });
      const results = await Promise.all(keys.map(key => this.fallbackCache.delete(key)));
      return results.filter(Boolean).length;
    }
  }

  /**
   * Delete many keys (alias for del with better naming)
   */
  async deleteMany(keys: string[]): Promise<number> {
    return this.del(...keys);
  }

  /**
   * Ping the Redis server
   */
  async ping(): Promise<string> {
    try {
      const result = await this.redis.ping();
      return result;
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Cache ping error:",
        error,
      });
      return await this.fallbackCache.ping();
    }
  }

  /**
   * Invalidate cache by strategy
   */
  async invalidateByStrategy(strategy: keyof typeof CACHE_PATTERNS): Promise<void> {
    try {
      const pattern = CACHE_PATTERNS[strategy];
      this.logger.info({
        tag: "CACHE",
        msg: `Invalidating strategy`,
        data: { strategy, pattern },
      });

      const matchingKeys = await this.keys(pattern);
      this.logger.info({
        tag: "CACHE",
        msg: `Found ${matchingKeys.length} keys matching pattern`,
        data: { pattern, matchingKeys },
      });

      await this.deletePattern(pattern);

      this.logger.info({
        tag: "CACHE",
        msg: `Successfully invalidated strategy`,
        data: { strategy },
      });
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: `Error invalidating strategy`,
        data: { strategy },
        error,
      });
      throw error;
    }
  }

  /**
   * Invalidate user-specific cache
   */
  async invalidateUserCache(userId: string): Promise<void> {
    const pattern = `user:${userId}:*`;
    await this.deletePattern(pattern);
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
    strategies: Record<string, number>;
  }> {
    try {
      const keys = await this.redis.keys("*");

      const strategies: Record<string, number> = {};
      for (const key of keys) {
        const strategy = key.split(":")[0];
        if (strategy) {
          strategies[strategy] = (strategies[strategy] || 0) + 1;
        }
      }

      return {
        totalKeys: keys.length,
        memoryUsage: "Memory info not available in Upstash",
        strategies,
      };
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Cache stats error:",
        error,
      });
      return {
        totalKeys: 0,
        memoryUsage: "0",
        strategies: {},
      };
    }
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<void> {
    try {
      await this.redis.flushdb();
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Cache clear error:",
        error,
      });
    }
  }

  /**
   * Cache wrapper for async functions
   */
  async withCache<T>(key: string, fn: () => Promise<T>, options: CacheOptions = {}): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached.cached && cached.data !== null) {
      return cached.data;
    }

    const result = await fn();
    await this.set(key, result, options);
    return result;
  }

  /**
   * Cache wrapper with automatic key generation
   */
  async withCacheKey<T>(
    type: "static" | "dynamic" | "user" | "api",
    params: any[],
    fn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const key = generateCacheKey[type](params?.[0], params?.[1], params?.[2]);
    return this.withCache(key, fn, options);
  }
}
