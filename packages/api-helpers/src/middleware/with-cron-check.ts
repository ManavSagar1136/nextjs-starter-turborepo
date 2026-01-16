/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { defaultCacheService } from "@buildbase/cache/factory";
import type { CronCheckOptions } from "./types";

/**
 * Get cron secret from environment variable
 */
function getCronSecret(): string {
  return process.env.CRON_SECRET || "";
}

/**
 * Generate a hash from string (simple hash for idempotency)
 */
async function generateHash(str: string): Promise<string> {
  // Use Web Crypto API if available (Edge Runtime)
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }
  // Fallback: simple hash
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Generate default idempotency key from request
 * Note: This function should be called before reading the body in the handler
 */
async function generateDefaultIdempotencyKey(req: NextRequest, bodyText?: string): Promise<string> {
  const url = req.url;
  const method = req.method;

  // Get body hash if provided
  let bodyHash = "";
  if (bodyText) {
    bodyHash = await generateHash(bodyText);
  }

  // Use timestamp window (round to nearest 5 minutes) to allow same request within window
  const timestamp = Math.floor(Date.now() / (5 * 60 * 1000));

  return `cron:${method}:${url}:${bodyHash}:${timestamp}`;
}

/**
 * Middleware to validate cron secret for cron job endpoints
 * Includes idempotency to prevent duplicate execution
 *
 * @example
 * ```ts
 * const handler = async (req: NextRequest) => {
 *   // Your cron job logic here
 *   return NextResponse.json({ success: true });
 * };
 *
 * export const GET = withCronCheck(handler);
 * export const POST = withCronCheck(handler);
 * ```
 *
 * @example With custom options
 * ```ts
 * export const GET = withCronCheck(handler, {
 *   headerName: "X-Custom-Secret",
 *   errorMessage: "Invalid cron secret",
 *   enableIdempotency: true,
 * });
 * ```
 *
 * @example With custom idempotency key
 * ```ts
 * export const POST = withCronCheck(handler, {
 *   idempotencyKey: async (req) => {
 *     const body = await req.json();
 *     return `cron:${body.taskId}:${new Date().toISOString().split('T')[0]}`;
 *   },
 * });
 * ```
 */
export function withCronCheck(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse | Response>,
  options?: CronCheckOptions
) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse | Response> => {
    const {
      headerName = "X-Cron-Secret",
      cronSecret,
      errorMessage,
      allowWithoutSecret = false,
      enableIdempotency = true,
      idempotencyKey,
      idempotencyTTL = 3600, // 1 hour default
      cacheService = defaultCacheService,
    } = options || {};

    // Get cron secret from header
    const providedSecret = req.headers.get(headerName);
    const expectedSecret = cronSecret || getCronSecret();

    // Validate cron secret
    if (!providedSecret) {
      if (allowWithoutSecret) {
        // Allow in development mode
        console.warn(`[withCronCheck] Cron request without secret (allowed in dev mode)`);
      } else {
        console.error(`[withCronCheck] Missing ${headerName} header`);
        return NextResponse.json({ error: "Unauthorized", message: "Missing cron secret" }, { status: 401 });
      }
    } else if (providedSecret !== expectedSecret) {
      console.error(`[withCronCheck] Invalid ${headerName} provided`, providedSecret.substring(0, 4) + "***");
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: errorMessage || "Invalid cron secret",
        },
        { status: 401 }
      );
    }

    // Idempotency check
    if (enableIdempotency) {
      try {
        // Read body once for idempotency key generation and handler
        // We'll read it early and recreate the request for the handler
        let bodyText: string | undefined;
        let requestForHandler = req;

        // Read body if needed (for default key generation or if custom key might need it)
        try {
          bodyText = await req.text();
          // Recreate request with body for handler and idempotency key generation
          requestForHandler = new NextRequest(req.url, {
            method: req.method,
            headers: req.headers,
            body: bodyText,
          });
        } catch {
          // Body not available or already consumed
          // Continue with original request
        }

        // Generate idempotency key (use recreated request if body was read)
        const key = idempotencyKey
          ? await idempotencyKey(requestForHandler)
          : await generateDefaultIdempotencyKey(requestForHandler, bodyText);

        const cacheKey = `cron:idempotency:${key}`;

        // Check if already processed
        const cached = await cacheService.get(cacheKey);
        if (cached && cached.data) {
          console.info(`[withCronCheck] Request already processed (idempotency key: ${cacheKey})`);

          // Return cached response
          try {
            const cachedResponse = JSON.parse(cached.data as string);
            return NextResponse.json(cachedResponse, {
              status: cachedResponse.status || 200,
            });
          } catch {
            // If cached data is not JSON, return it as text
            return new NextResponse(cached.data as string, {
              status: 200,
            });
          }
        }

        // Execute the handler
        try {
          const response = await handler(requestForHandler, ...args);

          // Cache the response
          let responseData: string;
          let status = 200;

          if (response instanceof NextResponse) {
            status = response.status;
            responseData = await response.clone().text();
          } else if (response instanceof Response) {
            status = response.status;
            responseData = await response.clone().text();
          } else {
            responseData = JSON.stringify(response);
          }

          // Store in cache
          await cacheService.set(cacheKey, JSON.stringify({ data: responseData, status }), { ttl: idempotencyTTL });

          return response;
        } catch (error) {
          console.error(
            `[withCronCheck] Error in cron job handler:`,
            error instanceof Error ? error.message : String(error)
          );

          return NextResponse.json(
            {
              success: false,
              error: "Internal server error",
              message: error instanceof Error ? error.message : "Unknown error occurred",
            },
            { status: 500 }
          );
        }
      } catch (cacheError) {
        // If cache fails, log but continue with execution
        console.warn(`[withCronCheck] Cache error, continuing without idempotency:`, cacheError);

        // Execute handler without idempotency
        // Note: If body was read above, we need to recreate request
        // For simplicity, we'll try to read body again or use original request
        try {
          return await handler(req, ...args);
        } catch (error) {
          console.error(
            `[withCronCheck] Error in cron job handler:`,
            error instanceof Error ? error.message : String(error)
          );

          return NextResponse.json(
            {
              success: false,
              error: "Internal server error",
              message: error instanceof Error ? error.message : "Unknown error occurred",
            },
            { status: 500 }
          );
        }
      }
    } else {
      // Execute without idempotency
      try {
        return await handler(req, ...args);
      } catch (error) {
        console.error(
          `[withCronCheck] Error in cron job handler:`,
          error instanceof Error ? error.message : String(error)
        );

        return NextResponse.json(
          {
            success: false,
            error: "Internal server error",
            message: error instanceof Error ? error.message : "Unknown error occurred",
          },
          { status: 500 }
        );
      }
    }
  };
}
