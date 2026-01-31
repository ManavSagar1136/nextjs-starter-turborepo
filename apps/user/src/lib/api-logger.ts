/**
 * API Route Logger Wrapper
 *
 * Provides automatic request logging for API routes with:
 * - Request ID tracking
 * - Timing metrics
 * - Error handling
 * - New Relic integration
 *
 * @example
 * ```ts
 * import { withLogging } from '@/lib/api-logger';
 *
 * async function handler(request: NextRequest, logger: Logger) {
 *   logger.info('Processing request');
 *   return NextResponse.json({ success: true });
 * }
 *
 * export const GET = withLogging(handler);
 * ```
 */

import { NextRequest, NextResponse } from "next/server";
import type { Logger } from "@buildbase/logger";
import { logger as rootLogger } from "@/lib/logger";
import {
  extractRequestContext,
  createRequestLogger,
  logRequestStart,
  logRequestEnd,
  type RequestContext,
} from "@buildbase/logger/middleware";
import { noticeError, addTransactionAttributes } from "@buildbase/logger/newrelic";

type RouteHandler = (
  request: NextRequest,
  logger: Logger,
  context: RequestContext
) => Promise<NextResponse> | NextResponse;

type RouteHandlerWithParams = (
  request: NextRequest,
  params: { params: Promise<Record<string, string>> },
  logger: Logger,
  context: RequestContext
) => Promise<NextResponse> | NextResponse;

/**
 * Wrap an API route handler with automatic logging
 *
 * Features:
 * - Automatic request/response logging
 * - Request ID generation and tracking
 * - Timing metrics
 * - Error handling with New Relic reporting
 * - Response header injection
 */
export function withLogging(handler: RouteHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const context = extractRequestContext(request);
    const reqLogger = createRequestLogger(rootLogger, context);

    // Add request context to New Relic transaction
    addTransactionAttributes({
      requestId: context.requestId,
      path: context.path || "",
      method: context.method || "",
    });

    logRequestStart(reqLogger, context);

    try {
      const response = await handler(request, reqLogger, context);
      const statusCode = response.status;

      // Add request ID to response
      response.headers.set("x-request-id", context.requestId);

      logRequestEnd(reqLogger, context, statusCode, Date.now() - startTime);

      return response;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      reqLogger.error(err, "Unhandled API error");
      noticeError(err, {
        requestId: context.requestId,
        path: context.path || "",
        method: context.method || "",
      });

      const response = NextResponse.json(
        {
          error: "Internal Server Error",
          requestId: context.requestId,
        },
        { status: 500 }
      );

      response.headers.set("x-request-id", context.requestId);
      logRequestEnd(reqLogger, context, 500, Date.now() - startTime);

      return response;
    }
  };
}

/**
 * Wrap an API route handler with params (for dynamic routes)
 *
 * @example
 * ```ts
 * // app/api/users/[id]/route.ts
 * import { withLoggingParams } from '@/lib/api-logger';
 *
 * async function handler(
 *   request: NextRequest,
 *   { params }: { params: Promise<{ id: string }> },
 *   logger: Logger
 * ) {
 *   const { id } = await params;
 *   logger.info({ userId: id }, 'Fetching user');
 *   return NextResponse.json({ id });
 * }
 *
 * export const GET = withLoggingParams(handler);
 * ```
 */
export function withLoggingParams(handler: RouteHandlerWithParams) {
  return async (
    request: NextRequest,
    routeParams: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    const startTime = Date.now();
    const context = extractRequestContext(request);
    const reqLogger = createRequestLogger(rootLogger, context);

    addTransactionAttributes({
      requestId: context.requestId,
      path: context.path || "",
      method: context.method || "",
    });

    logRequestStart(reqLogger, context);

    try {
      const response = await handler(request, routeParams, reqLogger, context);
      const statusCode = response.status;

      response.headers.set("x-request-id", context.requestId);
      logRequestEnd(reqLogger, context, statusCode, Date.now() - startTime);

      return response;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      reqLogger.error(err, "Unhandled API error");
      noticeError(err, {
        requestId: context.requestId,
        path: context.path || "",
        method: context.method || "",
      });

      const response = NextResponse.json(
        {
          error: "Internal Server Error",
          requestId: context.requestId,
        },
        { status: 500 }
      );

      response.headers.set("x-request-id", context.requestId);
      logRequestEnd(reqLogger, context, 500, Date.now() - startTime);

      return response;
    }
  };
}
