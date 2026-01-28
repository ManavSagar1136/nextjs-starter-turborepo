/**
 * @buildbase/testing - Enterprise-grade testing utilities for BuildBase NextJS Starter
 *
 * This package provides shared testing utilities, configurations, mocks,
 * fixtures, and E2E setup for all apps and packages in the monorepo.
 *
 * @example
 * ```ts
 * // Import render utilities
 * import { render, screen, userEvent } from '@buildbase/testing';
 *
 * // Import fixtures
 * import { createUserFixture, createWorkspaceFixture } from '@buildbase/testing/fixtures';
 *
 * // Import mocks
 * import { prismaMock } from '@buildbase/testing/mocks/prisma';
 * ```
 */

// Re-export testing utilities
export * from "./utils/render";

// Re-export fixtures
export * from "./fixtures";

// Version
export const VERSION = "0.0.0";
