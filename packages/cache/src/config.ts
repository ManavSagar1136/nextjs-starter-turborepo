/* eslint-disable @typescript-eslint/no-explicit-any */

import { env } from "@buildbase/env";

// Cache configuration
export interface CacheConfig {
  // Redis configuration
  redis: {
    url: string;
    token: string;
  };

  // Default TTL settings
  defaultTTL: number; // in seconds
  shortTTL: number; // for frequently changing data
  longTTL: number; // for static data

  // Cache strategies
  strategies: {
    static: {
      ttl: number;
      prefix: string;
    };
    dynamic: {
      ttl: number;
      prefix: string;
    };
    user: {
      ttl: number;
      prefix: string;
    };
    api: {
      ttl: number;
      prefix: string;
    };
  };

  // Rate limiting configuration
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    prefix: string;
  };

  // Timeout configuration
  timeout?: {
    default?: number; // milliseconds
    read?: number;
    write?: number;
  };

  // Retry configuration
  retry?: {
    maxAttempts?: number;
    baseDelay?: number; // milliseconds
    maxDelay?: number; // milliseconds
    exponentialBackoff?: boolean;
  };
}

// Default cache configuration factory
export const createCacheConfig = (options?: {
  redisUrl?: string;
  redisToken?: string;
  defaultTTL?: number;
  shortTTL?: number;
  longTTL?: number;
}): CacheConfig => {
  return {
    redis: {
      url: options?.redisUrl || env.UPSTASH_REDIS_REST_URL || "",
      token: options?.redisToken || env.UPSTASH_REDIS_REST_TOKEN || "",
    },
    defaultTTL: options?.defaultTTL ?? 300, // 5 minutes
    shortTTL: options?.shortTTL ?? 60, // 1 minute
    longTTL: options?.longTTL ?? 3600, // 1 hour
    strategies: {
      static: {
        ttl: 3600, // 1 hour
        prefix: "static:",
      },
      dynamic: {
        ttl: 300, // 5 minutes
        prefix: "dynamic:",
      },
      user: {
        ttl: 1800, // 30 minutes
        prefix: "user:",
      },
      api: {
        ttl: 600, // 10 minutes
        prefix: "api:",
      },
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
      prefix: "rate_limit:",
    },
    timeout: {
      default: 5000, // 5 seconds
      read: 3000, // 3 seconds
      write: 5000, // 5 seconds
    },
    retry: {
      maxAttempts: 3,
      baseDelay: 100, // 100ms
      maxDelay: 2000, // 2 seconds
      exponentialBackoff: true,
    },
  };
};

// Default cache configuration (uses environment variables)
export const CACHE_CONFIG: CacheConfig = createCacheConfig();

// Cache key generators
export const generateCacheKey = {
  static: (path: string, params?: Record<string, any>) => {
    const baseKey = `static:${path}`;
    if (params) {
      const paramString = JSON.stringify(params);
      // Use TextEncoder for edge compatibility instead of Buffer
      const encoded = btoa(paramString);
      return `${baseKey}:${encoded}`;
    }
    return baseKey;
  },

  dynamic: (resource: string, id: string, params?: Record<string, any>) => {
    const baseKey = `dynamic:${resource}:${id}`;
    if (params) {
      const paramString = JSON.stringify(params);
      const encoded = btoa(paramString);
      return `${baseKey}:${encoded}`;
    }
    return baseKey;
  },

  user: (userId: string, resource: string, params?: Record<string, any>) => {
    const baseKey = `user:${userId}:${resource}`;
    if (params) {
      const paramString = JSON.stringify(params);
      const encoded = btoa(paramString);
      return `${baseKey}:${encoded}`;
    }
    return baseKey;
  },

  workspace: (workspaceId: string, resource: string, params?: Record<string, any>) => {
    const baseKey = `workspace:${workspaceId}:${resource}`;
    if (params) {
      const paramString = JSON.stringify(params);
      const encoded = btoa(paramString);
      return `${baseKey}:${encoded}`;
    }
    return baseKey;
  },

  api: (endpoint: string, params?: Record<string, any>) => {
    const baseKey = `api:${endpoint}`;
    if (params) {
      const paramString = JSON.stringify(params);
      const encoded = btoa(paramString);
      return `${baseKey}:${encoded}`;
    }
    return baseKey;
  },

  rateLimit: (identifier: string) => `rate_limit:${identifier}`,
};

// Cache invalidation patterns
export const CACHE_PATTERNS = {
  static: "static:*",
  dynamic: "dynamic:*",
  user: "user:*",
  api: "api:*",
  rateLimit: "rate_limit:*",
} as const;
