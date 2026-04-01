import { redirect, notFound } from "next/navigation";
import { getServerSession } from "../auth/auth-server";
import { AccessDenied } from "./access-denied";

/**
 * Options for withServerAuth HOC
 */
export interface WithServerAuthOptions {
  /**
   * Redirect path when user is not authenticated
   * @default "/login"
   */
  redirectTo?: string;
  /**
   * Array of allowed roles (empty array means any authenticated user)
   * @default []
   */
  allowedRoles?: string[];
  /**
   * Behavior when user is authenticated but doesn't have required role
   * - "redirect": Redirect to a specific path (use roleFailureRedirectTo)
   * - "notFound": Show 404 page using Next.js notFound()
   * - "error": Show error layout using AccessDenied component
   * - "accessDenied": Alias for "error" - shows access denied error layout
   * @default "error"
   */
  onRoleFailure?: "redirect" | "notFound" | "error" | "accessDenied";
  /**
   * Redirect path when role check fails (only used if onRoleFailure is "redirect")
   * @default "/access-denied"
   */
  roleFailureRedirectTo?: string;
  /**
   * Custom error component to show when role check fails (only used if onRoleFailure is "error" or "accessDenied")
   * If not provided, uses default AccessDenied component
   */
  roleFailureComponent?: React.ComponentType<{ userRole?: string; allowedRoles?: string[] }>;
}

/**
 * Server-side authentication check utility
 *
 * Automatically reads and verifies JWT tokens from HTTP-only cookies.
 * Uses the same authentication mechanism as API routes for consistency.
 *
 * Uses `getServerSession` which reads the `cms-auth-token` cookie
 * and verifies it using JWT.
 *
 * @param Component - The component to wrap
 * @param options - Configuration options
 * @returns A server component wrapper that checks authentication
 *
 * @example
 * ```tsx
 * import { withServerAuth } from "@buildbase/helpers/hoc/withServerAuth";
 * import { Routes } from "@/data/routes";
 * import { APP_ROLES } from "@buildbase/database/user";
 *
 * export default withServerAuth(MyServerComponent, {
 *   redirectTo: Routes.login,
 *   allowedRoles: [APP_ROLES.ADMIN],
 * });
 * ```
 */
export function withServerAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: WithServerAuthOptions = {}
) {
  const {
    redirectTo = "/login",
    allowedRoles = [],
    onRoleFailure = "error",
    roleFailureRedirectTo = "/access-denied",
    roleFailureComponent,
  } = options;

  return async function AuthenticatedComponent(props: P) {
    // Get session from default getServerSession function
    const session = await getServerSession();

    // Redirect if not authenticated
    if (!session || !session.user) {
      redirect(redirectTo);
    }

    // Check roles if specified
    if (allowedRoles.length > 0 && session.user.role) {
      if (!allowedRoles.includes(session.user.role)) {
        // Handle role failure based on onRoleFailure option
        switch (onRoleFailure) {
          case "redirect":
            return redirect(roleFailureRedirectTo);
          case "notFound":
            return notFound();
          case "error":
          case "accessDenied":
          default:
            // Show error layout with AccessDenied component
            const ErrorComponent = roleFailureComponent || AccessDenied;
            return <ErrorComponent userRole={session.user.role} allowedRoles={allowedRoles} />;
        }
      }
    }

    return <Component {...props} />;
  };
}
