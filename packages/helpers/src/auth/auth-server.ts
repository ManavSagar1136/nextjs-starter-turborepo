import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { AUTH_TOKEN_COOKIE_NAME } from "./auth-token";
import { verifyAuthToken, type AuthenticatedUser } from "./auth-middleware";

/**
 * Get the current user session from HTTP-only cookie
 *
 * Reads the authentication token from cookies and verifies it using JWT.
 * This function is designed for use in Next.js server components and server actions.
 *
 * @returns Promise resolving to session object with user data, or null if not authenticated
 *
 * @example
 * ```tsx
 * import { getServerSession } from "@buildbase/helpers/auth";
 *
 * export default async function MyServerComponent() {
 *   const session = await getServerSession();
 *
 *   if (!session) {
 *     return <div>Not authenticated</div>;
 *   }
 *
 *   return <div>Hello {session.user.email}</div>;
 * }
 * ```
 */
export async function getServerSession(): Promise<{ user: AuthenticatedUser } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    // Verify the token using shared verification function
    const decoded = verifyAuthToken(token);

    return { user: decoded };
  } catch (error) {
    // Token expired, invalid, or verification failed
    // Return null to indicate not authenticated
    if (error instanceof jwt.TokenExpiredError || error instanceof jwt.JsonWebTokenError) {
      return null;
    }

    // Re-throw unexpected errors
    throw error;
  }
}
