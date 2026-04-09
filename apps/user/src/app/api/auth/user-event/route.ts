import { NextRequest, NextResponse } from "next/server";
import { AuthenticatedUser, withAuth, createResponseWithAuthToken } from "@buildbase/helpers/auth";
import { syncUser } from "@buildbase/database/user";

/**
 * POST /api/auth/user-event
 *
 * Handles user-level SDK events: user:created and user:updated.
 * Fired by the SDK when a user account is created or when profile data changes
 * (name, image, email).
 *
 * Actions:
 *   - Syncs user profile to DB (no role update — role is only set at login)
 *   - If the event is for the calling user, refreshes their JWT with updated profile data
 *     so the client immediately reflects the new name/image without re-login
 *
 * Note: role is intentionally NOT updated here. APP_ROLE is authoritative from
 * the SDK at login time only (verify route). Workspace roles live in WorkspaceMember.
 */
async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, user } = body;

    if (!eventType || (eventType !== "user:created" && eventType !== "user:updated")) {
      return NextResponse.json({ error: "eventType must be 'user:created' or 'user:updated'" }, { status: 400 });
    }

    if (!user) {
      return NextResponse.json({ error: "user is required" }, { status: 400 });
    }

    const userId = user.id || user._id;
    if (!userId) {
      return NextResponse.json({ error: "user.id is required" }, { status: 400 });
    }

    const userData = (request as any).authenticatedUser as AuthenticatedUser;

    console.log(`[user-event] Handling ${eventType} for user ${userId}`);

    // Sync user profile — do NOT update role (role is set at login only)
    const syncResult = await syncUser(
      {
        id: userId,
        email: user.email,
        name: user.name,
        image: user.image,
      },
      false // never update APP_ROLE from SDK events
    );

    if (!syncResult.success) {
      console.error(`[user-event] Failed to sync user:`, syncResult.error);
      // Continue — JWT refresh can still proceed
    }

    // If this event is for the currently authenticated user, refresh their JWT
    // so the client immediately sees the updated name/image without re-login.
    if (userData.sdkUserId && userData.sdkUserId === userId) {
      const updatedUserData = {
        ...userData,
        email: user.email ?? userData.email,
        name: user.name ?? userData.name,
        image: user.image ?? userData.image,
      };

      console.log(`[user-event] Refreshing JWT for current user ${userId}`);
      return createResponseWithAuthToken(
        {
          success: true,
          message: `User ${eventType === "user:created" ? "created" : "updated"} and token refreshed`,
        },
        updatedUserData
      );
    }

    return NextResponse.json({
      success: true,
      message: `User ${eventType === "user:created" ? "created" : "updated"} and synced`,
    });
  } catch (error) {
    console.error("[user-event] Error handling user event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const POST = withAuth(postHandler);
