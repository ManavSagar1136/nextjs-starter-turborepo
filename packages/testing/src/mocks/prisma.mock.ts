/**
 * Prisma Client Mock
 *
 * Provides a deep mock of PrismaClient for unit testing database operations
 * without connecting to a real database.
 *
 * @example
 * ```ts
 * import { prismaMock, resetPrismaMock } from '@buildbase/testing/mocks/prisma';
 *
 * // In your test file
 * vi.mock('@buildbase/database', () => ({
 *   prisma: prismaMock,
 * }));
 *
 * describe('UserService', () => {
 *   beforeEach(() => {
 *     resetPrismaMock();
 *   });
 *
 *   it('should find user by id', async () => {
 *     const mockUser = { id: '1', email: 'test@example.com' };
 *     prismaMock.user.findUnique.mockResolvedValue(mockUser);
 *
 *     const result = await findUserById('1');
 *     expect(result).toEqual(mockUser);
 *   });
 * });
 * ```
 */

import { mockDeep, mockReset, DeepMockProxy } from "vitest-mock-extended";

/**
 * Type for the Prisma Client
 * We use a generic type to avoid direct dependency on generated client
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaClientType = any;

/**
 * Type for the mocked Prisma Client
 */
export type MockPrismaClient = DeepMockProxy<PrismaClientType>;

/**
 * Deep mock of PrismaClient
 * All methods are automatically mocked with vi.fn()
 */
export const prismaMock: MockPrismaClient = mockDeep<PrismaClientType>();

/**
 * Reset all mock implementations and call history
 * Call this in beforeEach to ensure test isolation
 */
export function resetPrismaMock(): void {
  mockReset(prismaMock);
}

/**
 * Create a new Prisma mock instance
 * Useful when you need multiple isolated mock instances
 */
export function createPrismaMock(): MockPrismaClient {
  return mockDeep<PrismaClientType>();
}

/**
 * Helper to set up Prisma mock with common patterns
 *
 * @example
 * ```ts
 * const { prisma, reset } = setupPrismaMock();
 *
 * beforeEach(() => reset());
 *
 * it('test', async () => {
 *   prisma.user.findUnique.mockResolvedValue({ id: '1' });
 * });
 * ```
 */
export function setupPrismaMock() {
  const prisma = createPrismaMock();

  return {
    prisma,
    reset: () => mockReset(prisma),
  };
}

// Default export for convenience
export default prismaMock;
