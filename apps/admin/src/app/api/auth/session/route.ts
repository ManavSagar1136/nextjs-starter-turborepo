/**
 * Session Check API Route
 *
 * GET /api/auth/session
 * Returns current session status by validating the HTTP-only cookie.
 * Used by the login page to verify if the server recognizes the session
 * before trusting the client-side SDK auth state.
 *
 * IMPORTANT: This also validates that the user has the correct APP_ROLE
 * for accessing the admin dashboard. If the token has an invalid/missing role,
 * it returns unauthenticated to force re-login and get a fresh token.
 */

import { NextResponse } from "next/server";
import { getServerSession, clearAuthTokenCookie } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session || !session.user) {
      return NextResponse.json(
        {
          authenticated: false,
          message: "No valid session",
        },
        { status: 401 }
      );
    }

    // Validate that the user has a valid app role for the admin dashboard
    // The admin app requires APP_ROLES.ADMIN role
    const userRole = session.user.role;
    const isValidRole = userRole === APP_ROLES.ADMIN;

    if (!isValidRole) {
      // Token exists but has invalid/missing role - likely an old token or non-admin user
      // Clear it and force re-login to get a fresh token with correct structure
      console.log("[Session Check] Invalid role in token:", userRole, "- clearing token");
      const response = NextResponse.json(
        {
          authenticated: false,
          message: "Invalid session role, please re-login",
          debug: { tokenRole: userRole, expectedRoles: [APP_ROLES.ADMIN] },
        },
        { status: 401 }
      );
      return clearAuthTokenCookie(response);
    }

    return NextResponse.json({
      authenticated: true,
      sessionId: session.user.sessionId ?? null,
      user: {
        id: session.user.id || session.user.userId || session.user.sdkUserId,
        email: session.user.email,
        role: session.user.role,
      },
    });
  } catch (error) {
    console.error("[Session Check] Error:", error);
    return NextResponse.json(
      {
        authenticated: false,
        message: "Session validation failed",
      },
      { status: 401 }
    );
  }
}
