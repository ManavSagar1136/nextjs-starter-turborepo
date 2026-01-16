/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { defaultQStashReceiver } from "./factory";
import { defaultCacheService } from "@buildbase/cache/factory";
import type { QStashWebhookOptions } from "./types";
/**
 * Generate default idempotency key from QStash request
 * Uses messageId or deduplicationId from headers (preferred)
 * Falls back to URL + body hash if headers not available
 */
async function generateDefaultIdempotencyKey(req: NextRequest, bodyText?: string): Promise<string> {
  // QStash provides messageId or deduplicationId in headers
  const messageId = req.headers.get("upstash-message-id") || req.headers.get("Upstash-Message-Id") || "";
  const deduplicationId =
    req.headers.get("upstash-deduplication-id") || req.headers.get("Upstash-Deduplication-Id") || "";

  // Prefer deduplicationId, fallback to messageId
  if (deduplicationId) {
    return `qstash:dedup:${deduplicationId}`;
  }

  if (messageId) {
    return `qstash:message:${messageId}`;
  }

  // Fallback: use URL + body hash if no QStash headers
  const url = req.url;
  let bodyHash = "";
  if (bodyText) {
    // Simple hash
    let hash = 0;
    for (let i = 0; i < bodyText.length; i++) {
      const char = bodyText.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    bodyHash = Math.abs(hash).toString(16);
  }

  return `qstash:fallback:${url}:${bodyHash}`;
}

/**
 * Middleware to validate QStash webhook signatures and prevent duplicate execution
 * Includes built-in idempotency using messageId/deduplicationId
 *
 * @example
 * ```ts
 * // app/api/webhook/process/route.ts
 * import { withQStashWebhook } from "@buildbase/qstash/middleware";
 *
 * const handler = async (req: NextRequest) => {
 *   const body = await req.json();
 *   // Process webhook
 *   return NextResponse.json({ success: true });
 * };
 *
 * export const POST = withQStashWebhook(handler);
 * ```
 *
 * @example With custom options
 * ```ts
 * export const POST = withQStashWebhook(handler, {
 *   errorMessage: "Invalid QStash signature",
 *   idempotencyTTL: 7200, // 2 hours
 * });
 * ```
 *
 * @example With custom idempotency key
 * ```ts
 * export const POST = withQStashWebhook(handler, {
 *   idempotencyKey: async (req) => {
 *     const body = await req.json();
 *     return `qstash:${body.eventId}:${body.userId}`;
 *   },
 * });
 * ```
 */
export function withQStashWebhook(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse | Response>,
  options?: QStashWebhookOptions
) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse | Response> => {
    const {
      receiver = defaultQStashReceiver,
      enableIdempotency = true,
      idempotencyKey,
      idempotencyTTL = 3600, // 1 hour default
      cacheService = defaultCacheService,
      errorMessage,
      allowWithoutAuth = false,
    } = options || {};

    // Read body once for signature verification and idempotency
    // Note: verifyNextRequest consumes the body, so we need to store it
    let bodyText: string;
    try {
      bodyText = await req.text();
    } catch {
      bodyText = "";
    }

    // Verify QStash signature
    try {
      // Create a new request for verification (receiver needs Request, not NextRequest)
      const requestForVerification = new Request(req.url, {
        method: req.method,
        headers: req.headers,
        body: bodyText,
      });

      const verification = await receiver.verifyNextRequest(requestForVerification);

      if (!verification.valid) {
        if (allowWithoutAuth) {
          console.warn(`[withQStashWebhook] QStash request without valid signature (allowed in dev mode)`);
        } else {
          console.error(`[withQStashWebhook] Invalid QStash signature:`, verification.error);
          return NextResponse.json(
            {
              error: "Unauthorized",
              message: errorMessage || "Invalid QStash signature",
            },
            { status: 401 }
          );
        }
      }
    } catch (error) {
      if (allowWithoutAuth) {
        console.warn(`[withQStashWebhook] Signature verification error (allowed in dev mode):`, error);
      } else {
        console.error(`[withQStashWebhook] Error verifying signature:`, error);
        return NextResponse.json(
          {
            error: "Unauthorized",
            message: errorMessage || "Signature verification failed",
          },
          { status: 401 }
        );
      }
    }

    // Recreate request with body for handler
    const requestForHandler = new NextRequest(req.url, {
      method: req.method,
      headers: req.headers,
      body: bodyText,
    });

    // Idempotency check
    if (enableIdempotency) {
      try {
        // Generate idempotency key
        // Use stored bodyText (already read above)
        const key = idempotencyKey
          ? await idempotencyKey(requestForHandler)
          : await generateDefaultIdempotencyKey(requestForHandler, bodyText);

        const cacheKey = `qstash:idempotency:${key}`;

        // Check if already processed
        const cached = await cacheService.get(cacheKey);
        if (cached && cached.data) {
          console.info(`[withQStashWebhook] Request already processed (idempotency key: ${cacheKey})`);

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

        // Execute the handler with recreated request
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
            `[withQStashWebhook] Error in webhook handler:`,
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
        console.warn(`[withQStashWebhook] Cache error, continuing without idempotency:`, cacheError);

        // Execute handler without idempotency (use recreated request)
        try {
          return await handler(requestForHandler, ...args);
        } catch (error) {
          console.error(
            `[withQStashWebhook] Error in webhook handler:`,
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
      // Execute without idempotency (use recreated request)
      try {
        return await handler(requestForHandler, ...args);
      } catch (error) {
        console.error(
          `[withQStashWebhook] Error in webhook handler:`,
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
