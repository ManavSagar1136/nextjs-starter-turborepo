/**
 * Next.js Instrumentation
 *
 * This file is loaded before Next.js starts and is used to initialize
 * monitoring tools like New Relic APM.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only initialize New Relic on the Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Check if New Relic should be enabled
    if (process.env.NEW_RELIC_ENABLED === "true" && process.env.NEW_RELIC_LICENSE_KEY) {
      try {
        // Dynamic import to avoid loading in Edge runtime
        await import("newrelic");
        console.log("✅ New Relic APM initialized");
      } catch (error) {
        console.warn("⚠️ Failed to initialize New Relic:", error);
      }
    }
  }
}

/**
 * Optional: Handle uncaught errors
 * This is called when an error is thrown that isn't caught
 */
export function onRequestError(
  error: Error,
  request: { path: string; method: string },
  context: { routerKind: string; routePath: string; routeType: string }
) {
  // Log the error
  console.error("Unhandled request error:", {
    error: error.message,
    stack: error.stack,
    path: request.path,
    method: request.method,
    routerKind: context.routerKind,
    routePath: context.routePath,
    routeType: context.routeType,
  });

  // Report to New Relic if available
  if (process.env.NEW_RELIC_ENABLED === "true") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const newrelic = require("newrelic");
      newrelic.noticeError(error, {
        path: request.path,
        method: request.method,
        routerKind: context.routerKind,
        routePath: context.routePath,
        routeType: context.routeType,
      });
    } catch {
      // New Relic not available
    }
  }
}
