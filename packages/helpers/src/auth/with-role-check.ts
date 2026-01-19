import { NextRequest, NextResponse } from "next/server";
import { withAuth, type WithAuthOptions } from "./auth-middleware";
import type { AppRole } from "@buildbase/database/user";

/**
 * Options for withRoleCheck middleware
 * @deprecated Use WithAuthOptions from withAuth instead. This is kept for backward compatibility.
 */
export interface RoleCheckOptions extends WithAuthOptions {}

/**
 * Higher-order function to wrap API route handlers with role-based access control
 *
 * This is a convenience wrapper around `withAuth` that requires roles to be specified.
 * For more flexibility, use `withAuth` directly.
 *
 * **IMPORTANT**: This function checks APP_ROLES only (system-level roles: admin, user).
 * For workspace-level permissions, use `withPermissionCheck` instead.
 *
 * Checks if the authenticated user has one of the allowed APP_ROLES.
 * Roles are read from the JWT token (which contains the app role from Buildbase SaaS SDK).
 *
 * @param handler - The API route handler function
 * @param allowedRoles - Array of allowed APP_ROLES. Required.
 * @param options - Optional configuration
 * @returns Wrapped handler with role-based access control
 *
 * @example
 * ```typescript
 * import { withRoleCheck } from "@buildbase/helpers/auth";
 * import { APP_ROLES } from "@buildbase/database/user";
 *
 * const handlePOST = async (req: NextRequest) => {
 *   const user = (req as any).authenticatedUser;
 *   return NextResponse.json({ success: true, user });
 * };
 *
 * // Only allow ADMIN APP_ROLE
 * export const POST = withRoleCheck(handlePOST, [APP_ROLES.ADMIN]);
 *
 * // Allow multiple APP_ROLES
 * export const POST = withRoleCheck(handlePOST, [APP_ROLES.ADMIN, APP_ROLES.USER]);
 * ```
 */
export function withRoleCheck<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  allowedRoles: AppRole[],
  options: RoleCheckOptions = {}
): (request: NextRequest, ...args: T) => Promise<NextResponse> {
  // withRoleCheck requires roles, so we pass them to withAuth
  return withAuth(handler, allowedRoles, options);
}
