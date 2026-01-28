/**
 * Next.js Mocks
 *
 * Provides mocks for Next.js navigation, headers, and cookies.
 * Essential for testing components that use Next.js App Router features.
 *
 * @example
 * ```ts
 * import {
 *   mockRouter,
 *   mockSearchParams,
 *   mockPathname,
 *   resetNextMocks,
 *   setupNextMocks
 * } from '@buildbase/testing/mocks/next';
 *
 * // Setup mocks before tests
 * setupNextMocks();
 *
 * beforeEach(() => {
 *   resetNextMocks();
 * });
 *
 * it('navigates on button click', async () => {
 *   render(<MyComponent />);
 *   await userEvent.click(screen.getByText('Go'));
 *   expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
 * });
 * ```
 */

import { vi, type Mock } from "vitest";

// ============================================================================
// Router Mock (next/navigation)
// ============================================================================

export interface MockRouterType {
  push: Mock;
  replace: Mock;
  prefetch: Mock;
  back: Mock;
  forward: Mock;
  refresh: Mock;
}

/**
 * Mock router object for next/navigation useRouter hook
 */
export const mockRouter: MockRouterType = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn().mockResolvedValue(undefined),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
};

// ============================================================================
// Search Params Mock
// ============================================================================

/**
 * Mock search params - use like a URLSearchParams
 */
export const mockSearchParams = new URLSearchParams();

/**
 * Helper to set search params for testing
 */
export function setMockSearchParams(params: Record<string, string>): void {
  // Clear existing params
  Array.from(mockSearchParams.keys()).forEach(key => {
    mockSearchParams.delete(key);
  });
  // Set new params
  Object.entries(params).forEach(([key, value]) => {
    mockSearchParams.set(key, value);
  });
}

// ============================================================================
// Pathname Mock
// ============================================================================

let currentPathname = "/";

/**
 * Get current mock pathname
 */
export function getMockPathname(): string {
  return currentPathname;
}

/**
 * Set mock pathname for testing
 */
export function setMockPathname(pathname: string): void {
  currentPathname = pathname;
}

/**
 * Mock pathname value (for direct access)
 */
export const mockPathname = {
  get value() {
    return currentPathname;
  },
};

// ============================================================================
// Headers Mock (next/headers)
// ============================================================================

const headersStore = new Map<string, string>();

export const mockHeaders = {
  get: vi.fn((key: string) => headersStore.get(key) ?? null),
  has: vi.fn((key: string) => headersStore.has(key)),
  set: (key: string, value: string) => headersStore.set(key, value),
  delete: (key: string) => headersStore.delete(key),
  clear: () => headersStore.clear(),
  entries: () => headersStore.entries(),
  keys: () => headersStore.keys(),
  values: () => headersStore.values(),
  forEach: (callback: (value: string, key: string) => void) => headersStore.forEach(callback),
};

/**
 * Helper to set headers for testing
 */
export function setMockHeaders(headers: Record<string, string>): void {
  mockHeaders.clear();
  Object.entries(headers).forEach(([key, value]) => {
    mockHeaders.set(key, value);
  });
}

// ============================================================================
// Cookies Mock (next/headers)
// ============================================================================

interface MockCookie {
  name: string;
  value: string;
}

const cookiesStore = new Map<string, MockCookie>();

export const mockCookies = {
  get: vi.fn((name: string) => cookiesStore.get(name)),
  getAll: vi.fn(() => Array.from(cookiesStore.values())),
  has: vi.fn((name: string) => cookiesStore.has(name)),
  set: vi.fn((name: string, value: string) => {
    cookiesStore.set(name, { name, value });
  }),
  delete: vi.fn((name: string) => cookiesStore.delete(name)),
  clear: () => cookiesStore.clear(),
};

/**
 * Helper to set cookies for testing
 */
export function setMockCookies(cookies: Record<string, string>): void {
  mockCookies.clear();
  Object.entries(cookies).forEach(([name, value]) => {
    cookiesStore.set(name, { name, value });
  });
}

// ============================================================================
// Redirect & NotFound Mocks
// ============================================================================

/**
 * Mock redirect function from next/navigation
 */
export const mockRedirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});

/**
 * Mock notFound function from next/navigation
 */
export const mockNotFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

// ============================================================================
// Setup & Reset Functions
// ============================================================================

/**
 * Reset all Next.js mocks to initial state
 * Call in beforeEach for test isolation
 */
export function resetNextMocks(): void {
  // Reset router
  mockRouter.push.mockClear();
  mockRouter.replace.mockClear();
  mockRouter.prefetch.mockClear();
  mockRouter.back.mockClear();
  mockRouter.forward.mockClear();
  mockRouter.refresh.mockClear();

  // Reset search params
  Array.from(mockSearchParams.keys()).forEach(key => {
    mockSearchParams.delete(key);
  });

  // Reset pathname
  currentPathname = "/";

  // Reset headers
  mockHeaders.clear();
  mockHeaders.get.mockClear();
  mockHeaders.has.mockClear();

  // Reset cookies
  mockCookies.clear();
  mockCookies.get.mockClear();
  mockCookies.getAll.mockClear();
  mockCookies.has.mockClear();
  mockCookies.set.mockClear();
  mockCookies.delete.mockClear();

  // Reset redirect/notFound
  mockRedirect.mockClear();
  mockNotFound.mockClear();
}

/**
 * Setup Next.js mocks - call this to register the mocks with vi.mock
 *
 * Note: This function sets up the mock modules. You should call this
 * at the top of your test file or in a setup file.
 *
 * @example
 * ```ts
 * // In your test file
 * vi.mock('next/navigation', () => ({
 *   useRouter: () => mockRouter,
 *   useSearchParams: () => mockSearchParams,
 *   usePathname: () => getMockPathname(),
 *   redirect: mockRedirect,
 *   notFound: mockNotFound,
 * }));
 *
 * vi.mock('next/headers', () => ({
 *   headers: () => mockHeaders,
 *   cookies: () => mockCookies,
 * }));
 * ```
 */
export function getNextNavigationMock() {
  return {
    useRouter: () => mockRouter,
    useSearchParams: () => mockSearchParams,
    usePathname: () => getMockPathname(),
    redirect: mockRedirect,
    notFound: mockNotFound,
  };
}

export function getNextHeadersMock() {
  return {
    headers: () => mockHeaders,
    cookies: () => mockCookies,
  };
}

// Default export with all mocks
export default {
  router: mockRouter,
  searchParams: mockSearchParams,
  pathname: mockPathname,
  headers: mockHeaders,
  cookies: mockCookies,
  redirect: mockRedirect,
  notFound: mockNotFound,
  reset: resetNextMocks,
};
