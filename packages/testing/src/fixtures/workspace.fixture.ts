/**
 * Workspace Fixture Factory
 *
 * Generates mock workspace data for testing.
 * Matches the Workspace model from @buildbase/database Prisma schema.
 *
 * @example
 * ```ts
 * import { createWorkspaceFixture, createWorkspacesFixture } from '@buildbase/testing/fixtures';
 *
 * // Create a basic workspace
 * const workspace = createWorkspaceFixture();
 *
 * // Create with overrides
 * const customWorkspace = createWorkspaceFixture({
 *   name: 'My Team',
 *   slug: 'my-team',
 * });
 *
 * // Create multiple workspaces
 * const workspaces = createWorkspacesFixture(3);
 * ```
 */

import { faker } from "@faker-js/faker";

/**
 * Workspace type matching Prisma schema
 */
export interface Workspace {
  id: string;
  sdkWorkspaceId: string;
  name: string;
  image: string | null;
  slug: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Partial workspace for overrides
 */
export type WorkspaceOverrides = Partial<Workspace>;

/**
 * Generate a URL-safe slug from a name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Create a mock workspace with realistic fake data
 *
 * @param overrides - Optional partial workspace to override defaults
 * @returns Complete Workspace object
 */
export function createWorkspaceFixture(overrides: WorkspaceOverrides = {}): Workspace {
  const now = new Date();
  const name = overrides.name || faker.company.name();

  return {
    id: faker.database.mongodbObjectId(),
    sdkWorkspaceId: `ws_${faker.string.alphanumeric(20)}`,
    name,
    image: faker.image.urlLoremFlickr({ category: "business" }),
    slug: generateSlug(name),
    description: faker.company.catchPhrase(),
    isActive: true,
    createdAt: faker.date.past({ years: 1, refDate: now }),
    updatedAt: faker.date.recent({ days: 30, refDate: now }),
    ...overrides,
  };
}

/**
 * Create an inactive workspace (soft deleted)
 *
 * @param overrides - Optional partial workspace to override defaults
 * @returns Workspace with isActive: false
 */
export function createInactiveWorkspaceFixture(overrides: WorkspaceOverrides = {}): Workspace {
  return createWorkspaceFixture({
    isActive: false,
    ...overrides,
  });
}

/**
 * Create multiple workspaces
 *
 * @param count - Number of workspaces to create
 * @param overrides - Optional partial workspace to apply to all
 * @returns Array of Workspace objects
 */
export function createWorkspacesFixture(count: number, overrides: WorkspaceOverrides = {}): Workspace[] {
  return Array.from({ length: count }, () => createWorkspaceFixture(overrides));
}

/**
 * Create a workspace with specific slug
 *
 * @param slug - Slug to use
 * @param overrides - Optional partial workspace to override defaults
 * @returns Workspace with specified slug
 */
export function createWorkspaceWithSlugFixture(slug: string, overrides: WorkspaceOverrides = {}): Workspace {
  return createWorkspaceFixture({
    slug,
    ...overrides,
  });
}

// Default export
export default createWorkspaceFixture;
