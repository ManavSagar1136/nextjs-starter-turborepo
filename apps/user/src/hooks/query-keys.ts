/**
 * Centralized query keys for TanStack Query in user app
 * This ensures type-safe and consistent query key management
 */

export const queryKeys = {
  // Auth-related queries
  auth: {
    // all: ["auth"] as const,
    // user: () => [...queryKeys.auth.all, "user"] as const,
    // session: () => [...queryKeys.auth.all, "session"] as const,
  },
} as const;
