import { NextRequest, NextResponse } from "next/server";
import { clearAuthTokenCookie } from "@buildbase/helpers/auth";

export async function POST(_request: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  return clearAuthTokenCookie(response);
}
