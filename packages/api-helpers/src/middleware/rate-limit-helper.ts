import { ImageResponse } from "next/og";
import { NextRequest, NextResponse } from "next/server";
import { defaultRateLimiter } from "@buildbase/cache/factory";
import type { RateLimitConfig } from "@buildbase/cache/types";

export interface RateLimitOptions {
  config: RateLimitConfig;
  identifier?: (req: NextRequest) => string;
  errorMessage?: string;
}

/**
 * Get client IP address from request
 */
function getClientIP(req: NextRequest): string {
  // Check for forwarded IP first (from proxy/load balancer)
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")?.[0]?.trim() || "unknown";
  }

  // Check for real IP header
  const realIP = req.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Fallback to connection remote address
  return ((req as any)?.ip as string) || "unknown";
}

/**
 * Apply rate limiting to a request and execute the handler
 * Returns the response with rate limit headers added (if applicable)
 */
export async function applyRateLimit(
  req: NextRequest,
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse | ImageResponse | Response>,
  rateLimitOptions: RateLimitOptions,
  ...handlerArgs: any[]
): Promise<NextResponse | ImageResponse | Response> {
  const { config, identifier, errorMessage } = rateLimitOptions;

  // Generate identifier for rate limiting
  let rateLimitIdentifier: string;
  if (identifier) {
    rateLimitIdentifier = identifier(req);
  } else {
    // Default: use userId (available after auth) or IP address
    const userId = (req as any).userData?.id || (req as any).authenticatedUser?.userId;
    const ipAddress = getClientIP(req);
    rateLimitIdentifier = userId ? `ratelimit:${userId}` : `ratelimit:ip:${ipAddress}`;
  }

  // Check rate limit using default rate limiter
  const rateLimitResult = await defaultRateLimiter.checkRateLimit(rateLimitIdentifier, config);

  // If rate limit exceeded, return error response
  if (!rateLimitResult.success) {
    console.warn("Rate limit exceeded", {
      identifier: rateLimitIdentifier,
      limit: rateLimitResult.limit,
      remaining: rateLimitResult.remaining,
      retryAfter: rateLimitResult.retryAfter,
    });

    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        message: errorMessage || `Too many requests. Please try again in ${rateLimitResult.retryAfter} seconds.`,
        retryAfter: rateLimitResult.retryAfter,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          "Retry-After": rateLimitResult.retryAfter?.toString() || "0",
        },
      }
    );
  }

  // Execute handler
  const response = await handler(req, ...handlerArgs);

  // Add rate limit headers to response (skip for ImageResponse)
  if (!(response instanceof ImageResponse) && (response instanceof NextResponse || response instanceof Response)) {
    response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString());
    response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString());
    response.headers.set("X-RateLimit-Reset", rateLimitResult.reset.toString());
  }

  return response;
}
