import { NextRequest, NextResponse } from "next/server";
import { syncUser, APP_ROLES } from "@buildbase/database/user";
import { createResponseWithAuthToken } from "@buildbase/helpers/auth";
import { verifySDKToken } from "@buildbase/saas-sdk";

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    // Verify token with SDK
    const sdkResponse = await verifySDKToken({ code });

    if (!sdkResponse.success || !sdkResponse.user) {
      return NextResponse.json({
        success: false,
        message: sdkResponse.message || "Failed to verify token",
      });
    }

    const { sessionId, user: userData } = sdkResponse;

    // Check if user's app role is admin
    const userRole = userData.role || APP_ROLES.USER;
    if (userRole !== APP_ROLES.ADMIN) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied. Admin role required.",
        },
        { status: 403 }
      );
    }

    // Sync user to database - allow role update during login
    const syncResult = await syncUser(
      {
        id: userData.id || userData._id || "",
        email: userData.email,
        name: userData.name,
        image: userData.image,
        role: APP_ROLES.ADMIN, // Ensure admin role is set
      },
      true // Allow role update during login
    );

    if (!syncResult.success) {
      console.error("Failed to sync user:", syncResult.error);
      // Continue anyway - authentication can proceed even if DB sync fails
    }

    // Create response with auth token set as HTTP-only cookie
    return createResponseWithAuthToken(
      {
        success: true,
        message: "Token verified successfully",
        sessionId: sessionId,
        user: userData,
      },
      {
        sessionId: sessionId,
        sdkUserId: userData.id || userData._id,
        userId: syncResult.user?.id,
        user: userData,
      }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      message: "Failed to verify token",
    });
  }
}
