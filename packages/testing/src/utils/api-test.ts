/**
 * API Route Test Utilities
 *
 * Provides helpers for testing Next.js App Router API routes (route handlers).
 *
 * @example
 * ```ts
 * import { testApiRoute, createMockRequest } from '@buildbase/testing/utils/api-test';
 * import { GET, POST } from '@/app/api/users/route';
 *
 * describe('GET /api/users', () => {
 *   it('returns users list', async () => {
 *     const { status, data } = await testApiRoute(GET, {
 *       method: 'GET',
 *     });
 *
 *     expect(status).toBe(200);
 *     expect(data.users).toBeDefined();
 *   });
 * });
 * ```
 */

import { vi } from "vitest";

// ============================================================================
// Types
// ============================================================================

export interface MockRequestOptions {
  /**
   * HTTP method (GET, POST, PUT, PATCH, DELETE)
   */
  method?: string;

  /**
   * Request body (will be JSON stringified)
   */
  body?: unknown;

  /**
   * Request headers
   */
  headers?: Record<string, string>;

  /**
   * URL search params
   */
  searchParams?: Record<string, string>;

  /**
   * Base URL for the request
   */
  url?: string;
}

export interface MockRouteParams {
  params?: Record<string, string | string[]>;
}

export interface ApiTestResult<T = unknown> {
  /**
   * HTTP status code
   */
  status: number;

  /**
   * Parsed JSON response body
   */
  data: T;

  /**
   * Response headers
   */
  headers: Record<string, string>;

  /**
   * Raw Response object
   */
  response: Response;
}

// ============================================================================
// Mock Request Creation
// ============================================================================

/**
 * Create a mock NextRequest object for testing API routes
 *
 * @param options - Request configuration
 * @returns Mock Request object
 *
 * @example
 * ```ts
 * const request = createMockRequest({
 *   method: 'POST',
 *   body: { email: 'test@example.com' },
 *   headers: { Authorization: 'Bearer token' },
 * });
 * ```
 */
export function createMockRequest(options: MockRequestOptions = {}): Request {
  const { method = "GET", body, headers = {}, searchParams = {}, url = "http://localhost:3000/api/test" } = options;

  // Build URL with search params
  const urlObj = new URL(url);
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value);
  });

  // Create request init
  const init: RequestInit = {
    method,
    headers: new Headers({
      "Content-Type": "application/json",
      ...headers,
    }),
  };

  // Add body for non-GET requests
  if (body && method !== "GET") {
    init.body = JSON.stringify(body);
  }

  return new Request(urlObj.toString(), init);
}

/**
 * Create mock route context with params
 *
 * @param params - Route parameters
 * @returns Mock context object
 *
 * @example
 * ```ts
 * const context = createMockRouteContext({ id: '123' });
 * // context.params = { id: '123' }
 * ```
 */
export function createMockRouteContext(params: Record<string, string | string[]> = {}): MockRouteParams {
  return { params };
}

// ============================================================================
// API Route Testing
// ============================================================================

type RouteHandler = (request: Request, context?: MockRouteParams) => Promise<Response> | Response;

/**
 * Test an API route handler
 *
 * @param handler - Route handler function (GET, POST, etc.)
 * @param options - Request options
 * @param params - Route params
 * @returns Test result with status, data, and headers
 *
 * @example
 * ```ts
 * // Test a GET route
 * const { status, data } = await testApiRoute(GET, { method: 'GET' });
 *
 * // Test a POST route with body
 * const { status, data } = await testApiRoute(POST, {
 *   method: 'POST',
 *   body: { name: 'Test' },
 * });
 *
 * // Test a route with params
 * const { status, data } = await testApiRoute(
 *   GET,
 *   { method: 'GET' },
 *   { id: '123' }
 * );
 * ```
 */
export async function testApiRoute<T = unknown>(
  handler: RouteHandler,
  options: MockRequestOptions = {},
  params: Record<string, string | string[]> = {}
): Promise<ApiTestResult<T>> {
  const request = createMockRequest(options);
  const context = createMockRouteContext(params);

  const response = await handler(request, context);

  // Parse response
  const status = response.status;
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  // Try to parse JSON body
  let data: T;
  try {
    data = await response.clone().json();
  } catch {
    // If not JSON, return empty object
    data = {} as T;
  }

  return {
    status,
    data,
    headers,
    response,
  };
}

// ============================================================================
// Test Context Helper
// ============================================================================

export interface ApiTestContext {
  /**
   * Mock Prisma client (if using Prisma mock)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma?: any;

  /**
   * Create a mock request
   */
  createRequest: typeof createMockRequest;

  /**
   * Create route context with params
   */
  createContext: typeof createMockRouteContext;

  /**
   * Test an API route
   */
  testRoute: typeof testApiRoute;

  /**
   * Reset all mocks
   */
  resetMocks: () => void;
}

/**
 * Create a test context for API route testing
 *
 * @param prismaMock - Optional Prisma mock instance
 * @returns Test context with helpers
 *
 * @example
 * ```ts
 * import { prismaMock } from '@buildbase/testing/mocks/prisma';
 *
 * describe('API Routes', () => {
 *   const ctx = createApiTestContext(prismaMock);
 *
 *   beforeEach(() => {
 *     ctx.resetMocks();
 *   });
 *
 *   it('creates user', async () => {
 *     ctx.prisma.user.create.mockResolvedValue({ id: '1' });
 *
 *     const { status } = await ctx.testRoute(POST, {
 *       method: 'POST',
 *       body: { email: 'test@example.com' },
 *     });
 *
 *     expect(status).toBe(201);
 *   });
 * });
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createApiTestContext(prismaMock?: any): ApiTestContext {
  return {
    prisma: prismaMock,
    createRequest: createMockRequest,
    createContext: createMockRouteContext,
    testRoute: testApiRoute,
    resetMocks: () => {
      vi.clearAllMocks();
      if (prismaMock && typeof prismaMock.mockReset === "function") {
        prismaMock.mockReset();
      }
    },
  };
}

// ============================================================================
// Response Helpers
// ============================================================================

/**
 * Create a JSON response for testing
 *
 * @param data - Response data
 * @param status - HTTP status code
 * @returns Response object
 */
export function createJsonResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Create an error response for testing
 *
 * @param message - Error message
 * @param status - HTTP status code
 * @returns Response object
 */
export function createErrorResponse(message: string, status = 400): Response {
  return createJsonResponse({ error: message }, status);
}

// Default export
export default {
  createMockRequest,
  createMockRouteContext,
  testApiRoute,
  createApiTestContext,
  createJsonResponse,
  createErrorResponse,
};
