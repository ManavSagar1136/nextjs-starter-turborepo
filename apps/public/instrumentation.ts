/**
 * Next.js Instrumentation for public app
 *
 * For New Relic APM in production:
 * Set NODE_OPTIONS='-r newrelic' in your deployment
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Node.js specific initialization
  }
}
