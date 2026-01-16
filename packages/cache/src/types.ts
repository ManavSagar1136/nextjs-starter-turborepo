/* eslint-disable @typescript-eslint/no-explicit-any */

// Logger interface for dependency injection
export interface Logger {
  info: (data: { tag?: string; msg: string; data?: any; error?: any }) => void;
  warn: (data: { tag?: string; msg: string; data?: any; error?: any }) => void;
  error: (data: { tag?: string; msg: string; data?: any; error?: any }) => void;
}

// Default no-op logger
export const noOpLogger: Logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
};

// Cache options
export interface CacheOptions {
  ttl?: number;
  strategy?: "static" | "dynamic" | "user" | "api";
  compress?: boolean;
}

// Cache result
export interface CacheResult<T> {
  data: T | null;
  cached: boolean;
  ttl?: number;
}

// Enhanced cache options
export interface EnhancedCacheOptions extends CacheOptions {
  enableFallback?: boolean;
  fallbackTTL?: number;
  forceFallback?: boolean;
  versioned?: boolean;
  enableCache?: boolean;
  enableRateLimit?: boolean;
  rateLimitConfig?: {
    windowMs: number;
    maxRequests: number;
  };
  cacheStrategy?: "static" | "dynamic" | "user" | "api";
}

// Enhanced cache result
export interface EnhancedCacheResult<T> {
  data: T;
  cached: boolean;
  source: "redis" | "fallback" | "fresh";
  ttl?: number;
  rateLimited: boolean;
  rateLimitInfo?: {
    remaining: number;
    reset: number;
    retryAfter?: number;
  };
}

// Rate limit result
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// Rate limit config
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  identifier?: string;
}
