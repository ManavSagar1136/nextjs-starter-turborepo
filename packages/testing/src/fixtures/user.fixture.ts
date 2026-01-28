/**
 * User Fixture Factory
 *
 * Generates mock user data for testing.
 * Matches the User model from @buildbase/database Prisma schema.
 *
 * @example
 * ```ts
 * import { createUserFixture, createAdminFixture } from '@buildbase/testing/fixtures';
 *
 * // Create a basic user
 * const user = createUserFixture();
 *
 * // Create with overrides
 * const customUser = createUserFixture({
 *   email: 'custom@example.com',
 *   role: 'admin',
 * });
 *
 * // Create multiple users
 * const users = createUsersFixture(5);
 * ```
 */

import { faker } from "@faker-js/faker";

/**
 * User type matching Prisma schema
 */
export interface User {
  id: string;
  sdkUserId: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string | null;
  currentWorkspaceId: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

/**
 * Partial user for overrides
 */
export type UserOverrides = Partial<User>;

/**
 * Create a mock user with realistic fake data
 *
 * @param overrides - Optional partial user to override defaults
 * @returns Complete User object
 */
export function createUserFixture(overrides: UserOverrides = {}): User {
  const now = new Date();

  return {
    id: faker.database.mongodbObjectId(),
    sdkUserId: `sdk_${faker.string.alphanumeric(20)}`,
    email: faker.internet.email().toLowerCase(),
    name: faker.person.fullName(),
    image: faker.image.avatar(),
    role: "user",
    currentWorkspaceId: null,
    createdAt: faker.date.past({ years: 1, refDate: now }),
    updatedAt: faker.date.recent({ days: 30, refDate: now }),
    lastLoginAt: faker.date.recent({ days: 7, refDate: now }),
    ...overrides,
  };
}

/**
 * Create an admin user
 *
 * @param overrides - Optional partial user to override defaults
 * @returns Complete User object with admin role
 */
export function createAdminFixture(overrides: UserOverrides = {}): User {
  return createUserFixture({
    role: "admin",
    ...overrides,
  });
}

/**
 * Create multiple users
 *
 * @param count - Number of users to create
 * @param overrides - Optional partial user to apply to all
 * @returns Array of User objects
 */
export function createUsersFixture(count: number, overrides: UserOverrides = {}): User[] {
  return Array.from({ length: count }, () => createUserFixture(overrides));
}

/**
 * Create a user with workspace assignment
 *
 * @param workspaceId - Workspace ID to assign
 * @param overrides - Optional partial user to override defaults
 * @returns User with currentWorkspaceId set
 */
export function createUserWithWorkspaceFixture(workspaceId: string, overrides: UserOverrides = {}): User {
  return createUserFixture({
    currentWorkspaceId: workspaceId,
    ...overrides,
  });
}

// Default export
export default createUserFixture;
