/**
 * Test Fixtures (Factories)
 *
 * Provides factory functions for generating realistic mock data
 * based on the Prisma schema models.
 *
 * @example
 * ```ts
 * import {
 *   createUserFixture,
 *   createWorkspaceFixture,
 *   createUsersFixture,
 * } from '@buildbase/testing/fixtures';
 *
 * // Single entities
 * const user = createUserFixture();
 * const workspace = createWorkspaceFixture();
 *
 * // With overrides
 * const admin = createUserFixture({ role: 'admin' });
 *
 * // Multiple entities
 * const users = createUsersFixture(10);
 * ```
 */

// User fixtures
export {
  createUserFixture,
  createAdminFixture,
  createUsersFixture,
  createUserWithWorkspaceFixture,
  type User,
  type UserOverrides,
} from "./user.fixture";

// Workspace fixtures
export {
  createWorkspaceFixture,
  createInactiveWorkspaceFixture,
  createWorkspacesFixture,
  createWorkspaceWithSlugFixture,
  type Workspace,
  type WorkspaceOverrides,
} from "./workspace.fixture";

/**
 * Create a user with an associated workspace
 * Convenience function for common test scenario
 */
export function createUserWithWorkspace() {
  const { createWorkspaceFixture: createWs } = require("./workspace.fixture");
  const { createUserFixture: createUsr } = require("./user.fixture");

  const workspace = createWs();
  const user = createUsr({ currentWorkspaceId: workspace.id });

  return { user, workspace };
}
