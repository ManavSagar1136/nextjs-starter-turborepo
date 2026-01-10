import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { clearAuthTokenCookie, AUTH_TOKEN_COOKIE_NAME } from "./auth-token";

export interface AuthenticatedUser extends JwtPayload {
  userId?: string; // Database user ID
  sdkUserId?: string; // SDK user ID (from Buildbase)
  email?: string;
  workspaceId?: string;
  workspaceName?: string;
  role?: string;
  [key: string]: any;
}

export interface AuthMiddlewareResult {
  success: boolean;
  user?: AuthenticatedUser;
  response?: NextResponse;
  error?: string;
  isInternalApiKey?: boolean;
}

/**
 * Check if the request uses internal API key authentication
 * @param request - Next.js request object
 * @returns boolean indicating if internal API key is valid
 */
const checkInternalApiKey = (request: NextRequest): boolean => {
  const internalApiKey = process.env.INTERNAL_API_KEY;
  if (!internalApiKey) {
    return false;
  }

  const authHeader = request.headers.get("Authorization");
  return authHeader === `Bearer ${internalApiKey}`;
};

/**
 * Middleware helper to authenticate API requests using JWT token from cookies or internal API key
 * @param request - Next.js request object
 * @returns AuthMiddlewareResult with user data or error response
 */
export const authenticateRequest = (request: NextRequest): AuthMiddlewareResult => {
  try {
    // Check for internal API key first (bypasses user authentication)
    if (checkInternalApiKey(request)) {
      return {
        success: true,
        isInternalApiKey: true,
        user: {
          role: "internal",
          isInternal: true,
        } as AuthenticatedUser,
      };
    }

    // Get token from HTTP-only cookie only (we no longer use Authorization header for user tokens)
    // Cookies are automatically sent by the browser and are more secure (HTTP-only)
    const token = request.cookies.get(AUTH_TOKEN_COOKIE_NAME)?.value;

    if (!token) {
      return {
        success: false,
        response: NextResponse.json({ error: "No authentication token found" }, { status: 401 }),
        error: "No authentication token found",
      };
    }

    // Verify the token
    const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "dev-jwt-secret-change-in-production";
    const decoded = jwt.verify(token, jwtSecret) as AuthenticatedUser;

    return {
      success: true,
      user: decoded,
      isInternalApiKey: false,
    };
  } catch (error) {
    console.error("Authentication error:", error);

    if (error instanceof jwt.TokenExpiredError) {
      // Clear the expired token cookie automatically
      const response = clearAuthTokenCookie(NextResponse.json({ error: "Token has expired" }, { status: 401 }));
      return {
        success: false,
        response,
        error: "Token has expired",
      };
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return {
        success: false,
        response: NextResponse.json({ error: "Invalid token" }, { status: 401 }),
        error: "Invalid token",
      };
    }

    return {
      success: false,
      response: NextResponse.json({ error: "Authentication failed" }, { status: 401 }),
      error: "Authentication failed",
    };
  }
};

/**
 * Unified higher-order function to wrap API route handlers with authentication and optional role-based access control
 * Combines withAuth and withRoleCheck into a single, flexible function
 *
 * @param handler - The API route handler function
 * @param allowedRoles - Optional array of allowed roles. If empty or not provided, only authentication is required
 * @returns Wrapped handler with authentication and optional role check
 *
 * @example
 * ```typescript
 * // Basic authentication only
 * const handlePOST = async (req: NextRequest, user: AuthenticatedUser) => {
 *   return NextResponse.json({ success: true });
 * };
 * export const POST = withAuth(handlePOST);
 *
 * // Authentication with role check
 * export const POST = withAuth(handlePOST, ["admin", "manager"]);
 *
 * // Multiple roles allowed
 * export const POST = withAuth(handlePOST, ["admin", "manager", "editor"]);
 * ```
 */
export const withAuth = <T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  allowedRoles?: string[]
) => {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const authResult = authenticateRequest(request);

    if (!authResult.success || !authResult.user) {
      return authResult.response || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = authResult.user;

    if (allowedRoles && allowedRoles.length > 0) {
      const userRole = user.role;

      if (!userRole || !allowedRoles.includes(userRole)) {
        console.error(`User role ${userRole || "undefined"} not in allowed roles: ${allowedRoles.join(", ")}`);
        return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 });
      }
    }

    (request as any).authenticatedUser = user;

    return handler(request, ...args);
  };
};
