import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "@buildbase/env";
import { clearAuthTokenCookie, AUTH_TOKEN_COOKIE_NAME } from "./auth-token";
import type { AppRole } from "@buildbase/database/user";

export interface AuthenticatedUser extends JwtPayload {
  userId?: string; // Database user ID
  sdkUserId?: string; // SDK user ID (from Buildbase)
  email?: string;
  workspaceId?: string;
  workspaceName?: string;
  role?: string;
  [key: string]: any;
}

/**
 * Shared function to extract auth token from NextRequest cookies
 * @param request - Next.js request object
 * @returns Token string or undefined if not found
 */
export const getAuthTokenFromRequest = (request: NextRequest): string | undefined => {
  return request.cookies.get(AUTH_TOKEN_COOKIE_NAME)?.value;
};

/**
 * Shared function to verify JWT token
 * @param token - JWT token string to verify
 * @returns Decoded user data or throws error
 */
export const verifyAuthToken = (token: string): AuthenticatedUser => {
  const jwtSecret = env.APP_JWT_SECRET as string;
  return jwt.verify(token, jwtSecret) as AuthenticatedUser;
};

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
  const internalApiKey = env.API_SECRET;
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
    const token = getAuthTokenFromRequest(request);

    if (!token) {
      return {
        success: false,
        response: NextResponse.json({ error: "No authentication token found" }, { status: 401 }),
        error: "No authentication token found",
      };
    }

    // Verify the token using shared verification function
    const decoded = verifyAuthToken(token);

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

export interface WithAuthOptions {
  /**
   * Whether to allow internal API key to bypass role checks
   * @default true
   */
  allowInternalApiKey?: boolean;
}

/**
 * Unified higher-order function to wrap API route handlers with authentication and optional role-based access control
 *
 * **IMPORTANT**: This function checks APP_ROLES only (system-level roles: admin, user).
 * For workspace-level permissions, use `withPermissionCheck` instead.
 *
 * Roles are read from the JWT token (which contains the app role from Buildbase SaaS SDK).
 * The role stored in the token should be an APP_ROLE (admin or user).
 *
 * @param handler - The API route handler function
 * @param allowedRoles - Optional array of allowed APP_ROLES. If empty or not provided, only authentication is required
 * @param options - Optional configuration
 * @returns Wrapped handler with authentication and optional role check
 *
 * @example
 * ```typescript
 * import { withAuth } from "@buildbase/helpers/auth";
 * import { APP_ROLES } from "@buildbase/database/user";
 *
 * // Basic authentication only
 * const handlePOST = async (req: NextRequest) => {
 *   const user = (req as any).authenticatedUser;
 *   return NextResponse.json({ success: true, user });
 * };
 * export const POST = withAuth(handlePOST);
 *
 * // Authentication with APP_ROLE check
 * export const POST = withAuth(handlePOST, [APP_ROLES.ADMIN]);
 *
 * // Multiple APP_ROLES allowed
 * export const POST = withAuth(handlePOST, [APP_ROLES.ADMIN, APP_ROLES.USER]);
 * ```
 */
export const withAuth = <T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  allowedRoles?: AppRole[],
  options: WithAuthOptions = {}
) => {
  const { allowInternalApiKey = true } = options;

  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const authResult = authenticateRequest(request);

    if (!authResult.success || !authResult.user) {
      return authResult.response || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = authResult.user;

    // Allow internal API key to bypass role checks if configured
    if (allowInternalApiKey && authResult.isInternalApiKey) {
      (request as any).authenticatedUser = user;
      return handler(request, ...args);
    }

    // Check roles if specified
    if (allowedRoles && allowedRoles.length > 0) {
      const userRole = user.role as AppRole | undefined;

      if (!userRole || !allowedRoles.includes(userRole)) {
        console.error(`User role ${userRole || "undefined"} not in allowed roles: ${allowedRoles.join(", ")}`);
        return NextResponse.json(
          {
            error: "Forbidden",
            message: `Insufficient permissions. Required roles: ${allowedRoles.join(", ")}`,
          },
          { status: 403 }
        );
      }
    }

    (request as any).authenticatedUser = user;

    return handler(request, ...args);
  };
};
