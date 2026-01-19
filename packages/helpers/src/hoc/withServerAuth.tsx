import { redirect } from "next/navigation";
import { getServerSession } from "../auth/auth-server";

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
  const { redirectTo = "/login", allowedRoles = [] } = options;

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
        redirect(redirectTo);
      }
    }

    return <Component {...props} />;
  };
}
