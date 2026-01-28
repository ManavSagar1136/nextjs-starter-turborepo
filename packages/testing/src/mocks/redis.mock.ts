/**
 * Redis/Cache Mock
 *
 * Provides an in-memory mock for @buildbase/cache Redis operations.
 *
 * @example
 * ```ts
 * import { createTestCacheService, mockCacheStore } from '@buildbase/testing/mocks/redis';
 *
 * describe('CacheService', () => {
 *   const cache = createTestCacheService();
 *
 *   beforeEach(() => {
 *     cache.clear();
 *   });
 *
 *   it('caches values', async () => {
 *     await cache.set('key', { data: 'value' });
 *     const result = await cache.get('key');
 *     expect(result).toEqual({ data: 'value' });
 *   });
 * });
 * ```
 */

import { vi } from "vitest";

// ============================================================================
// Types
// ============================================================================

export interface CacheEntry<T = unknown> {
  value: T;
  expiresAt: number | null;
}

export interface CacheSetOptions {
  /**
   * Time to live in seconds
   */
  ttl?: number;

  /**
   * Cache strategy name
   */
  strategy?: "static" | "dynamic" | "user" | "api";
}

export interface MockCacheService {
  get: <T>(key: string) => Promise<T | null>;
  set: <T>(key: string, value: T, options?: CacheSetOptions) => Promise<void>;
  delete: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  has: (key: string) => Promise<boolean>;
  keys: () => Promise<string[]>;

  /**
   * Get all entries (for testing)
   */
  getAll: () => Map<string, CacheEntry>;

  /**
   * Simulate TTL expiration (for testing)
   */
  expireKey: (key: string) => void;

  /**
   * With cache wrapper
   */
  withCache: <T>(key: string, fn: () => Promise<T>, options?: CacheSetOptions) => Promise<T>;
}

// ============================================================================
// In-Memory Cache Store
// ============================================================================

/**
 * Global mock cache store
 * Use this to inspect cached values in tests
 */
export const mockCacheStore = new Map<string, CacheEntry>();

// ============================================================================
// Mock Cache Service
// ============================================================================

/**
 * Create a test cache service instance
 *
 * @returns Mock cache service with in-memory storage
 *
 * @example
 * ```ts
 * const cache = createTestCacheService();
 *
 * await cache.set('user:123', { name: 'John' }, { ttl: 60 });
 * const user = await cache.get('user:123');
 * ```
 */
export function createTestCacheService(): MockCacheService {
  const store = new Map<string, CacheEntry>();

  const isExpired = (entry: CacheEntry): boolean => {
    if (entry.expiresAt === null) return false;
    return Date.now() > entry.expiresAt;
  };

  const getMock = async <T>(key: string): Promise<T | null> => {
    const entry = store.get(key);
    if (!entry) return null;
    if (isExpired(entry)) {
      store.delete(key);
      return null;
    }
    return entry.value as T;
  };

  const withCacheMock = async <T>(key: string, fn: () => Promise<T>, options?: CacheSetOptions): Promise<T> => {
    const cached = store.get(key);
    if (cached && !isExpired(cached)) {
      return cached.value as T;
    }

    const result = await fn();
    const ttl = options?.ttl;
    const expiresAt = ttl ? Date.now() + ttl * 1000 : null;
    store.set(key, { value: result, expiresAt });
    return result;
  };

  return {
    get: vi.fn(getMock) as <T>(key: string) => Promise<T | null>,

    set: vi.fn(async <T>(key: string, value: T, options?: CacheSetOptions): Promise<void> => {
      const ttl = options?.ttl;
      const expiresAt = ttl ? Date.now() + ttl * 1000 : null;
      store.set(key, { value, expiresAt });
    }),

    delete: vi.fn(async (key: string): Promise<void> => {
      store.delete(key);
    }),

    clear: vi.fn(async (): Promise<void> => {
      store.clear();
    }),

    has: vi.fn(async (key: string): Promise<boolean> => {
      const entry = store.get(key);
      if (!entry) return false;
      if (isExpired(entry)) {
        store.delete(key);
        return false;
      }
      return true;
    }),

    keys: vi.fn(async (): Promise<string[]> => {
      // Filter out expired keys
      const validKeys: string[] = [];
      store.forEach((entry, key) => {
        if (!isExpired(entry)) {
          validKeys.push(key);
        }
      });
      return validKeys;
    }),

    getAll: () => store,

    expireKey: (key: string) => {
      const entry = store.get(key);
      if (entry) {
        store.set(key, { ...entry, expiresAt: Date.now() - 1 });
      }
    },

    withCache: vi.fn(withCacheMock) as <T>(key: string, fn: () => Promise<T>, options?: CacheSetOptions) => Promise<T>,
  };
}

// ============================================================================
// Rate Limiter Mock
// ============================================================================

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export interface MockRateLimiter {
  checkRateLimit: (identifier: string, config?: { requests: number; window: number }) => Promise<RateLimitResult>;
  reset: (identifier: string) => void;
  resetAll: () => void;
}

/**
 * Create a test rate limiter
 *
 * @returns Mock rate limiter
 *
 * @example
 * ```ts
 * const rateLimiter = createTestRateLimiter();
 *
 * const result = await rateLimiter.checkRateLimit('user:123', {
 *   requests: 10,
 *   window: 60,
 * });
 * ```
 */
export function createTestRateLimiter(): MockRateLimiter {
  const counts = new Map<string, { count: number; resetAt: number }>();

  return {
    checkRateLimit: vi.fn(
      async (identifier: string, config = { requests: 10, window: 60 }): Promise<RateLimitResult> => {
        const now = Date.now();
        let entry = counts.get(identifier);

        // Reset if window expired
        if (entry && entry.resetAt <= now) {
          entry = undefined;
        }

        if (!entry) {
          entry = {
            count: 0,
            resetAt: now + config.window * 1000,
          };
        }

        entry.count++;
        counts.set(identifier, entry);

        const success = entry.count <= config.requests;
        const remaining = Math.max(0, config.requests - entry.count);

        return {
          success,
          limit: config.requests,
          remaining,
          reset: entry.resetAt,
        };
      }
    ),

    reset: (identifier: string) => {
      counts.delete(identifier);
    },

    resetAll: () => {
      counts.clear();
    },
  };
}

// ============================================================================
// Default Instance
// ============================================================================

/**
 * Default cache service instance
 */
export const defaultMockCache = createTestCacheService();

/**
 * Default rate limiter instance
 */
export const defaultMockRateLimiter = createTestRateLimiter();

// Default export
export default {
  createTestCacheService,
  createTestRateLimiter,
  mockCacheStore,
  defaultMockCache,
  defaultMockRateLimiter,
};
