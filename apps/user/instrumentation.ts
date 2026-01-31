/**
 * Next.js Instrumentation
 *
 * Note: New Relic initialization is handled via NODE_OPTIONS or
 * by importing newrelic at the top of server entry points.
 *
 * For New Relic APM in production:
 * 1. Set NEW_RELIC_ENABLED=true
 * 2. Set NEW_RELIC_LICENSE_KEY=your-key
 * 3. Set NODE_OPTIONS='-r newrelic' in your deployment
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Instrumentation runs in both Node.js and Edge runtimes
  // New Relic only works in Node.js and requires native modules,
  // so we don't initialize it here to avoid bundler issues.

  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Node.js specific initialization can go here
    // (but not newrelic - use NODE_OPTIONS instead)
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    // Edge runtime initialization can go here
  }
}
