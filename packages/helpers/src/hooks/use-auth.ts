"use client";

import { useSDKAuth } from "@buildbase/saas-sdk";

/**
 * Authentication information returned by useAuth hook
 */
export interface AuthInfo {
  isAuthenticated: boolean;
  isLoading: boolean;
  userRole?: string | null;
  isAdmin?: boolean;
  user?: {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
    role?: string;
  } | null;
}

/**
 * Base authentication hook that provides authentication state
 * Uses the SDK authentication system
 *
 * @returns AuthInfo object with authentication state
 *
 * @example
 * ```tsx
 * const { isAuthenticated, isLoading, user } = useAuth();
 *
 * if (isLoading) return <Loading />;
 * if (!isAuthenticated) return <LoginPrompt />;
 * return <Dashboard />;
 * ```
 */
export const useAuth = (): AuthInfo => {
  const { isAuthenticated, isLoading, user, userRole } = useSDKAuth();

  return {
    isAuthenticated,
    isLoading,
    userRole: userRole || null,
    user: user || null,
  };
};

/**
 * Authentication hook with role-based checks
 * Extends useAuth with role validation
 *
 * @param requiredRoles - Array of allowed roles (empty array means any authenticated user)
 * @returns AuthInfo with role-based authentication status
 *
 * @example
 * ```tsx
 * const { isAuthenticated, isLoading } = useAuthRole([APP_ROLES.ADMIN]);
 *
 * if (!isAuthenticated) {
 *   // User doesn't have required role
 * }
 * ```
 */
export const useAuthRole = (requiredRoles: string[] = []): AuthInfo => {
  const { isAuthenticated, isLoading, userRole, user } = useSDKAuth();

  // If no roles specified, any authenticated user is allowed
  const hasRequiredRole = requiredRoles.length === 0 || (userRole && requiredRoles.includes(userRole));

  const roleBasedAuth = isAuthenticated && hasRequiredRole;

  return {
    isAuthenticated: roleBasedAuth as boolean,
    isLoading,
    userRole: userRole || null,
    user: user || null,
  };
};
