/**
 * Session Check API Route
 *
 * GET /api/auth/session
 * Returns current session status by validating the HTTP-only cookie.
 * Used by the login page to verify if the server recognizes the session
 * before trusting the client-side SDK auth state.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "@buildbase/helpers/auth";

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

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
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
