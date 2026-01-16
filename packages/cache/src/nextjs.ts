/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Next.js specific exports
 * This file contains Next.js-specific functionality like middleware and route handlers
 *
 * Note: We don't re-export everything to maintain tree-shaking compatibility with Vercel
 */

// Import only what's needed for Next.js integration
import { defaultCacheService, defaultRateLimiter } from "./factory";
import { RATE_LIMIT_CONFIGS } from "./rate-limiter";
import type { RateLimitConfig } from "./types";

// Next.js specific types (only import if Next.js is available)
type NextRequest = any;
type NextResponse = any;

/**
 * Wrapper for Next.js API routes with caching and rate limiting
 * Usage:
 * ```typescript
 * export const GET = withCacheAndRateLimit(handler, options);
 * ```
 */
export function withCacheAndRateLimit(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>,
  options: {
    enableCache?: boolean;
    enableRateLimit?: boolean;
    cacheStrategy?: "static" | "dynamic" | "user" | "api";
    rateLimitConfig?: {
      windowMs: number;
      maxRequests: number;
    };
    cacheTTL?: number;
    cacheKey?: (req: NextRequest) => string;
  } = {}
) {
  // This is a placeholder - full implementation would require Next.js types
  // In a real implementation, this would wrap the handler with cache/rate limit logic
  return handler;
}

/**
 * Create a cached API route handler for Next.js
 */
export function createCachedApiHandler<T>(
  handler: (req: NextRequest, ...args: any[]) => Promise<T>,
  options: {
    cacheStrategy?: "static" | "dynamic" | "user" | "api";
    cacheTTL?: number;
    rateLimitConfig?: {
      windowMs: number;
      maxRequests: number;
    };
    cacheKey?: (req: NextRequest) => string;
  } = {}
) {
  // Placeholder - full implementation would integrate with Next.js Response
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const result = await handler(req, ...args);
    return result as any;
  };
}
