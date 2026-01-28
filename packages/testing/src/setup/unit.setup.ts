/**
 * Unit Test Setup File
 *
 * This file runs before all unit tests to set up the test environment.
 * Include it in your vitest.config.ts setupFiles array.
 *
 * @example
 * ```ts
 * // vitest.config.ts
 * export default defineConfig({
 *   test: {
 *     setupFiles: ['@buildbase/testing/setup/unit'],
 *   },
 * });
 * ```
 */

import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// ============================================================================
// Extend Vitest's expect with Testing Library matchers
// ============================================================================

expect.extend(matchers);

// ============================================================================
// Cleanup after each test
// ============================================================================

afterEach(() => {
  cleanup();
});

// ============================================================================
// Global Mocks
// ============================================================================

/**
 * Mock window.matchMedia
 * Required for components that use media queries
 */
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

/**
 * Mock window.ResizeObserver
 * Required for components that observe element sizes
 */
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  value: ResizeObserverMock,
});

/**
 * Mock window.IntersectionObserver
 * Required for components that use intersection observer
 */
class IntersectionObserverMock {
  readonly root: Element | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn().mockReturnValue([]);
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  value: IntersectionObserverMock,
});

/**
 * Mock window.scrollTo
 * Required for components that scroll the window
 */
Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: vi.fn(),
});

/**
 * Mock URL.createObjectURL and URL.revokeObjectURL
 * Required for components that work with blobs/files
 */
if (typeof URL.createObjectURL === "undefined") {
  Object.defineProperty(URL, "createObjectURL", {
    writable: true,
    value: vi.fn().mockReturnValue("blob:mock-url"),
  });
}

if (typeof URL.revokeObjectURL === "undefined") {
  Object.defineProperty(URL, "revokeObjectURL", {
    writable: true,
    value: vi.fn(),
  });
}

/**
 * Suppress console errors/warnings in tests (optional)
 * Uncomment if you want to reduce test noise
 */
// vi.spyOn(console, 'error').mockImplementation(() => {});
// vi.spyOn(console, 'warn').mockImplementation(() => {});

// ============================================================================
// Global Test Utilities
// ============================================================================

/**
 * Helper to wait for next tick
 */
export const nextTick = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Helper to flush all promises
 */
export const flushPromises = () => new Promise(resolve => setImmediate(resolve));

// ============================================================================
// Export setup status
// ============================================================================

export const UNIT_SETUP_VERSION = "1.0.0";
