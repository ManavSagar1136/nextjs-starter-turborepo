/**
 * HTTP Mock (MSW)
 *
 * Mock Service Worker setup for mocking external HTTP requests.
 *
 * @example
 * ```ts
 * import { server, http, HttpResponse } from '@buildbase/testing/mocks/http';
 *
 * // In your test file
 * beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
 * afterEach(() => server.resetHandlers());
 * afterAll(() => server.close());
 *
 * it('fetches data', async () => {
 *   server.use(
 *     http.get('/api/users', () => {
 *       return HttpResponse.json([{ id: 1, name: 'John' }]);
 *     })
 *   );
 *
 *   const response = await fetch('/api/users');
 *   const data = await response.json();
 *   expect(data).toHaveLength(1);
 * });
 * ```
 */

import { setupServer } from "msw/node";
import { http, HttpResponse, type HttpHandler } from "msw";

// ============================================================================
// Default Handlers
// ============================================================================

/**
 * Default handlers for common endpoints
 * These are always active unless overridden
 */
export const defaultHandlers: HttpHandler[] = [
  // Health check endpoint
  http.get("/api/health", () => {
    return HttpResponse.json({ status: "ok", timestamp: new Date().toISOString() });
  }),

  // Echo endpoint for testing
  http.post("/api/echo", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ echo: body });
  }),
];

// ============================================================================
// MSW Server Setup
// ============================================================================

/**
 * MSW server instance
 * Use this to intercept HTTP requests in tests
 */
export const server = setupServer(...defaultHandlers);

// ============================================================================
// Re-exports from MSW
// ============================================================================

export { http, HttpResponse };

// Export types
export type { HttpHandler };

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Add handlers to the server for a specific test
 *
 * @param handlers - Array of HTTP handlers
 *
 * @example
 * ```ts
 * addHandlers([
 *   http.get('/api/users', () => HttpResponse.json([])),
 * ]);
 * ```
 */
export function addHandlers(handlers: HttpHandler[]): void {
  server.use(...handlers);
}

/**
 * Create a handler that returns JSON data
 *
 * @param method - HTTP method
 * @param path - URL path
 * @param data - Response data
 * @param status - HTTP status code
 *
 * @example
 * ```ts
 * const handler = createJsonHandler('get', '/api/users', [{ id: 1 }]);
 * server.use(handler);
 * ```
 */
export function createJsonHandler<
  T extends Record<string, unknown> | Array<unknown> | string | number | boolean | null,
>(method: "get" | "post" | "put" | "patch" | "delete", path: string, data: T, status = 200): HttpHandler {
  return http[method](path, () => {
    return HttpResponse.json(data, { status });
  });
}

/**
 * Create a handler that returns an error
 *
 * @param method - HTTP method
 * @param path - URL path
 * @param message - Error message
 * @param status - HTTP status code
 *
 * @example
 * ```ts
 * const handler = createErrorHandler('get', '/api/users', 'Not found', 404);
 * server.use(handler);
 * ```
 */
export function createErrorHandler(
  method: "get" | "post" | "put" | "patch" | "delete",
  path: string,
  message: string,
  status = 400
): HttpHandler {
  return http[method](path, () => {
    return HttpResponse.json({ error: message }, { status });
  });
}

/**
 * Create a handler that delays response
 *
 * @param method - HTTP method
 * @param path - URL path
 * @param data - Response data
 * @param delayMs - Delay in milliseconds
 *
 * @example
 * ```ts
 * const handler = createDelayedHandler('get', '/api/slow', { data: 'slow' }, 2000);
 * server.use(handler);
 * ```
 */
export function createDelayedHandler<
  T extends Record<string, unknown> | Array<unknown> | string | number | boolean | null,
>(method: "get" | "post" | "put" | "patch" | "delete", path: string, data: T, delayMs: number): HttpHandler {
  return http[method](path, async () => {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    return HttpResponse.json(data);
  });
}

/**
 * Create a handler that fails with network error
 *
 * @param method - HTTP method
 * @param path - URL path
 *
 * @example
 * ```ts
 * const handler = createNetworkErrorHandler('get', '/api/fail');
 * server.use(handler);
 * ```
 */
export function createNetworkErrorHandler(
  method: "get" | "post" | "put" | "patch" | "delete",
  path: string
): HttpHandler {
  return http[method](path, () => {
    return HttpResponse.error();
  });
}

// ============================================================================
// Setup Helpers
// ============================================================================

/**
 * Standard MSW server setup for test files
 *
 * Call this at the top of your test file or in a setup file
 *
 * @example
 * ```ts
 * import { setupMswServer } from '@buildbase/testing/mocks/http';
 *
 * setupMswServer();
 *
 * // Or with custom setup
 * const { server } = setupMswServer({
 *   onUnhandledRequest: 'warn',
 * });
 * ```
 */
export function setupMswServer(options?: { onUnhandledRequest?: "error" | "warn" | "bypass" }) {
  const { onUnhandledRequest = "error" } = options ?? {};

  if (typeof beforeAll !== "undefined") {
    beforeAll(() => server.listen({ onUnhandledRequest }));
  }

  if (typeof afterEach !== "undefined") {
    afterEach(() => server.resetHandlers());
  }

  if (typeof afterAll !== "undefined") {
    afterAll(() => server.close());
  }

  return { server };
}

// Default export
export default {
  server,
  http,
  HttpResponse,
  defaultHandlers,
  addHandlers,
  createJsonHandler,
  createErrorHandler,
  createDelayedHandler,
  createNetworkErrorHandler,
  setupMswServer,
};
