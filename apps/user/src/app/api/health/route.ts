/**
 * Health Check API Route
 *
 * Example of using @buildbase/logger in API routes with proper request tracking.
 *
 * GET /api/health
 * Returns service health status with request tracking
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { extractRequestContext, createRequestLogger, logRequestStart, logRequestEnd } from "@buildbase/logger/middleware";

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Extract request context for logging
  const context = extractRequestContext(request);
  const reqLogger = createRequestLogger(logger, context);

  // Log request start
  logRequestStart(reqLogger, context);

  try {
    // Simulate health checks
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "user-app",
      requestId: context.requestId,
      checks: {
        api: "ok",
        // Add more health checks as needed:
        // database: await checkDatabase(),
        // cache: await checkCache(),
      },
    };

    reqLogger.info({ health }, "Health check completed");

    const response = NextResponse.json(health, { status: 200 });

    // Add request ID to response headers for tracing
    response.headers.set("x-request-id", context.requestId);

    // Log request completion
    logRequestEnd(reqLogger, context, 200, Date.now() - startTime);

    return response;
  } catch (error) {
    reqLogger.error(error instanceof Error ? error : new Error(String(error)), "Health check failed");

    const response = NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        requestId: context.requestId,
      },
      { status: 503 }
    );

    response.headers.set("x-request-id", context.requestId);
    logRequestEnd(reqLogger, context, 503, Date.now() - startTime);

    return response;
  }
}
