/**
 * Middleware utilities for request logging and tracking
 *
 * @example
 * ```ts
 * // Next.js middleware.ts
 * import { withRequestId } from '@buildbase/logger/middleware';
 *
 * export function middleware(request: NextRequest) {
 *   return withRequestId(request);
 * }
 * ```
 */

import { randomUUID } from "crypto";
import type { Logger } from "./types.js";

/**
 * Header name for request ID
 */
export const REQUEST_ID_HEADER = "x-request-id";

/**
 * Header name for correlation ID (for distributed tracing)
 */
export const CORRELATION_ID_HEADER = "x-correlation-id";

/**
 * Generate a new request ID
 */
export const generateRequestId = (): string => {
  return randomUUID();
};

/**
 * Extract request ID from headers or generate a new one
 */
export const getOrCreateRequestId = (headers: Headers | Record<string, string | string[] | undefined>): string => {
  if (headers instanceof Headers) {
    return headers.get(REQUEST_ID_HEADER) || generateRequestId();
  }

  const headerValue = headers[REQUEST_ID_HEADER];
  if (typeof headerValue === "string") {
    return headerValue;
  }
  if (Array.isArray(headerValue) && headerValue.length > 0) {
    return headerValue[0]!;
  }
  return generateRequestId();
};

/**
 * Extract correlation ID from headers
 */
export const getCorrelationId = (
  headers: Headers | Record<string, string | string[] | undefined>
): string | undefined => {
  if (headers instanceof Headers) {
    return headers.get(CORRELATION_ID_HEADER) || undefined;
  }

  const headerValue = headers[CORRELATION_ID_HEADER];
  if (typeof headerValue === "string") {
    return headerValue;
  }
  if (Array.isArray(headerValue) && headerValue.length > 0) {
    return headerValue[0];
  }
  return undefined;
};

/**
 * Request context for logging
 */
export interface RequestContext {
  requestId: string;
  correlationId?: string;
  method?: string;
  path?: string;
  userAgent?: string;
  ip?: string;
}

/**
 * Extract request context from a Request object
 */
export const extractRequestContext = (request: Request, existingRequestId?: string): RequestContext => {
  const url = new URL(request.url);
  const headers = request.headers;

  return {
    requestId: existingRequestId || getOrCreateRequestId(headers),
    correlationId: getCorrelationId(headers),
    method: request.method,
    path: url.pathname,
    userAgent: headers.get("user-agent") || undefined,
    ip: headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || undefined,
  };
};

/**
 * Create a request-scoped logger with context
 */
export const createRequestLogger = (logger: Logger, context: RequestContext): Logger => {
  return logger.child({
    requestId: context.requestId,
    ...(context.correlationId && { correlationId: context.correlationId }),
  });
};

/**
 * Log request start
 */
export const logRequestStart = (logger: Logger, context: RequestContext): void => {
  logger.info(
    {
      requestId: context.requestId,
      method: context.method,
      path: context.path,
      userAgent: context.userAgent,
      ip: context.ip,
      ...(context.correlationId && { correlationId: context.correlationId }),
    },
    "Request started"
  );
};

/**
 * Log request completion
 */
export const logRequestEnd = (
  logger: Logger,
  context: RequestContext,
  statusCode: number,
  durationMs: number
): void => {
  const level = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";

  logger[level](
    {
      requestId: context.requestId,
      method: context.method,
      path: context.path,
      statusCode,
      durationMs,
      ...(context.correlationId && { correlationId: context.correlationId }),
    },
    `Request completed with status ${statusCode}`
  );
};

/**
 * Next.js middleware helper to add request ID
 * Returns headers to merge into the response
 *
 * @example
 * ```ts
 * // middleware.ts
 * import { NextResponse } from 'next/server';
 * import { withRequestId } from '@buildbase/logger/middleware';
 *
 * export function middleware(request: NextRequest) {
 *   const { requestId, headers } = withRequestId(request);
 *
 *   const response = NextResponse.next({
 *     request: { headers: request.headers },
 *   });
 *
 *   // Add request ID to response headers
 *   headers.forEach((value, key) => {
 *     response.headers.set(key, value);
 *   });
 *
 *   return response;
 * }
 * ```
 */
export const withRequestId = (request: Request): { requestId: string; headers: Headers } => {
  const requestId = getOrCreateRequestId(request.headers);
  const responseHeaders = new Headers();

  // Set request ID header for downstream services
  responseHeaders.set(REQUEST_ID_HEADER, requestId);

  // Propagate correlation ID if present
  const correlationId = getCorrelationId(request.headers);
  if (correlationId) {
    responseHeaders.set(CORRELATION_ID_HEADER, correlationId);
  }

  return { requestId, headers: responseHeaders };
};

/**
 * Async local storage for request context (Node.js 16+)
 * Allows accessing request context anywhere in the call stack
 */
import { AsyncLocalStorage } from "async_hooks";

const requestContextStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Run a function with request context available via getRequestContext()
 */
export const runWithRequestContext = <T>(context: RequestContext, fn: () => T): T => {
  return requestContextStorage.run(context, fn);
};

/**
 * Get the current request context (if available)
 * Returns undefined if not running within runWithRequestContext
 */
export const getRequestContext = (): RequestContext | undefined => {
  return requestContextStorage.getStore();
};

/**
 * Get the current request ID (if available)
 */
export const getCurrentRequestId = (): string | undefined => {
  return getRequestContext()?.requestId;
};
