import { NextRequest, NextResponse } from "next/server";

interface RateLimitWindow {
  timestamps: number[];
}

// In-memory store — works for single-instance deployments.
// For multi-instance (e.g. Vercel with multiple regions), replace with Upstash Redis.
const store = new Map<string, RateLimitWindow>();

function slidingWindowCheck(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key) ?? { timestamps: [] };
  entry.timestamps = entry.timestamps.filter(t => now - t < windowMs);
  entry.timestamps.push(now);
  store.set(key, entry);
  return entry.timestamps.length <= limit;
}

// Evict stale keys every 5 minutes to prevent unbounded memory growth.
setInterval(
  () => {
    const cutoff = Date.now() - 60_000;
    for (const [key, entry] of store) {
      if (entry.timestamps.every(t => t < cutoff)) store.delete(key);
    }
  },
  5 * 60 * 1000
);

/**
 * Rate-limits a route by authenticated user ID (falls back to IP).
 * Must be composed inside withPermissionCheck so req.authenticatedUser is set.
 *
 * @param limit   Max requests allowed in the window (default 30)
 * @param windowMs Window duration in ms (default 60 000 — 1 minute)
 *
 * @example
 * export const POST = withPermissionCheck(
 *   withRateLimit(handlePOST, { limit: 20, windowMs: 60_000 }),
 *   [WORKSPACE_ROLES.ADMIN]
 * );
 */
export function withRateLimit<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  { limit = 30, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {}
): (request: NextRequest, ...args: T) => Promise<NextResponse> {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const user = (request as any).authenticatedUser as { userId?: string } | undefined;
    const key = `rl:${user?.userId ?? request.headers.get("x-forwarded-for") ?? "unknown"}`;

    if (!slidingWindowCheck(key, limit, windowMs)) {
      return NextResponse.json(
        { error: "Too Many Requests", message: "Rate limit exceeded. Please slow down." },
        { status: 429 }
      );
    }

    return handler(request, ...args);
  };
}
