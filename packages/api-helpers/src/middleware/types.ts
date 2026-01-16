import type { NextRequest } from "next/server";
import type { CacheService } from "@buildbase/cache/service";

/**
 * Options for cron middleware
 */
export interface CronCheckOptions {
  /**
   * Custom header name for cron secret
   * @default "X-Cron-Secret"
   */
  headerName?: string;

  /**
   * Custom cron secret (overrides CRON_SECRET env var)
   */
  cronSecret?: string;

  /**
   * Custom error message when cron secret is invalid
   */
  errorMessage?: string;

  /**
   * Whether to allow requests without cron secret (for development)
   * @default false
   */
  allowWithoutSecret?: boolean;

  /**
   * Enable idempotency to prevent duplicate execution
   * @default true
   */
  enableIdempotency?: boolean;

  /**
   * Custom function to generate idempotency key
   * If not provided, uses URL + body hash + timestamp window
   */
  idempotencyKey?: (req: NextRequest) => Promise<string> | string;

  /**
   * TTL for idempotency cache in seconds
   * @default 3600 (1 hour)
   */
  idempotencyTTL?: number;

  /**
   * Cache service instance (optional, uses defaultCacheService if not provided)
   */
  cacheService?: CacheService;
}
