/**
 * API Route Logger Wrapper for public app
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

export function withLogging(handler: RouteHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
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
      const response = await handler(request, reqLogger, context);
      response.headers.set("x-request-id", context.requestId);
      logRequestEnd(reqLogger, context, response.status, Date.now() - startTime);
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
        { error: "Internal Server Error", requestId: context.requestId },
        { status: 500 }
      );
      response.headers.set("x-request-id", context.requestId);
      logRequestEnd(reqLogger, context, 500, Date.now() - startTime);
      return response;
    }
  };
}
