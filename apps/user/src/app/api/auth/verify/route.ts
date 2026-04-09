import { NextRequest, NextResponse } from "next/server";
import { syncUser, syncAllWorkspaces, APP_ROLES, WORKSPACE_ROLES, type SDKWorkspaceData } from "@buildbase/database/user";
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

    const { sessionId, user: userData, workspaces = [] } = sdkResponse;

    if (!userData.id && !userData._id) {
      return NextResponse.json({
        success: false,
        message: "User ID is missing from SDK response",
      });
    }

    const userId = userData.id || userData._id || "";

    // Sync user to database - allow role update during login
    // Default to USER if role is not provided from SDK
    const syncResult = await syncUser(
      {
        id: userId,
        email: userData.email,
        name: userData.name,
        image: userData.image,
        role: userData.role || APP_ROLES.USER, // Default to USER if not provided
      },
      true // Allow role update during login
    );

    if (!syncResult.success) {
      console.error("Failed to sync user:", syncResult.error);
      // Continue anyway - authentication can proceed even if DB sync fails
    }

    // Sync workspaces if provided
    let workspacesSyncResult = null;
    if (workspaces && Array.isArray(workspaces) && workspaces.length > 0) {
      // Transform workspaces to SDKWorkspaceData format
      const workspaceData: SDKWorkspaceData[] = workspaces.map((ws: any) => {
        // Find user's role in this workspace
        const userInWorkspace = ws.users?.find((u: any) => u._id === userData.id || u.id === userData.id);
        const userRole = userInWorkspace?.role || ws.role || WORKSPACE_ROLES.VIEWER;

        return {
          id: ws.id || ws._id || ws.workspaceId,
          name: ws.name || `Workspace ${ws.id || ws._id}`,
          image: ws.image,
          slug: ws.slug,
          description: ws.description,
          role: userRole,
        };
      });

      // Sync all workspaces
      workspacesSyncResult = await syncAllWorkspaces(
        userId,
        workspaceData,
        userData.workspaceId || userData.currentWorkspaceId
      );

      if (!workspacesSyncResult.success) {
        console.error(
          "Failed to sync workspaces:",
          "error" in workspacesSyncResult ? workspacesSyncResult.error : "Unknown error"
        );
        // Continue anyway - authentication can proceed
      }
    }

    // Create response with auth token set as HTTP-only cookie
    // IMPORTANT: role must be at top level for withServerAuth to work correctly
    const userRole = syncResult.user?.role || userData.role || APP_ROLES.USER;

    return createResponseWithAuthToken(
      {
        success: true,
        message: "Token verified successfully",
        sessionId: sessionId,
        user: userData,
        workspaces: workspacesSyncResult
          ? {
              synced: workspacesSyncResult.syncedCount || 0,
              total: workspacesSyncResult.totalCount || 0,
            }
          : undefined,
      },
      {
        sessionId: sessionId,
        sdkUserId: userData.id || userData._id,
        userId: syncResult.user?.id,
        email: userData.email,
        role: userRole, // Must be at top level for withServerAuth role check
        user: userData,
        workspaceId: userData.workspaceId || userData.currentWorkspaceId,
        workspaceName: userData.workspaceName,
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
