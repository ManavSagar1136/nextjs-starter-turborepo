import { NextRequest, NextResponse } from "next/server";
import { AuthenticatedUser, withAuth, createResponseWithAuthToken } from "@buildbase/helpers/auth";
import {
  syncWorkspace,
  addUserToWorkspace,
  updateUserCurrentWorkspace,
  getWorkspaceMemberRole,
  DEFAULT_ROLE,
} from "@buildbase/database/user";

/**
 * POST /api/auth/workspace-change
 *
 * Handles workspace change when user switches workspaces via the SDK's WorkspaceSwitcher.
 * This endpoint is called from the onWorkspaceChange callback in SaaSProvider.
 *
 * It:
 * 1. Syncs the workspace to the database
 * 2. Ensures the user is added to the workspace with the correct role
 * 3. Updates the user's current workspace preference
 * 4. Generates a new auth token with the updated workspace context
 *
 * @param request - NextRequest containing workspace, user, and role in the body
 * @returns Response with new auth token set as HTTP-only cookie
 */
async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspace, user, role } = body;

    console.log(`[workspace-change] Received workspace change request:`, {
      workspaceId: workspace?.id || workspace?._id,
      workspaceName: workspace?.name,
      userId: user?.id || user?._id,
      userEmail: user?.email,
      role,
    });

    // Validate required fields
    if (!workspace) {
      return NextResponse.json({ success: false, error: "Workspace is required" }, { status: 400 });
    }

    if (!user) {
      return NextResponse.json({ success: false, error: "User is required" }, { status: 400 });
    }

    // Get authenticated user from request (set by withAuth middleware)
    const userData = (request as any).authenticatedUser as AuthenticatedUser;

    if (!userData || !userData.sdkUserId) {
      return NextResponse.json({ success: false, error: "User not authenticated" }, { status: 401 });
    }

    // Extract workspace ID
    const workspaceId = workspace.id || workspace._id || workspace.workspaceId;
    if (!workspaceId) {
      return NextResponse.json({ success: false, error: "Workspace ID is required" }, { status: 400 });
    }

    // Resolve user's workspace role.
    // SDK provides role: string | null in OnWorkspaceChangeParams.
    // If null, read the existing DB membership role to avoid overwriting it with DEFAULT_ROLE.
    let userRole: string = role || DEFAULT_ROLE;
    if (!role) {
      const roleResult = await getWorkspaceMemberRole(userData.sdkUserId, workspaceId);
      if (roleResult.role) {
        userRole = roleResult.role;
      }
    }

    console.log(`[workspace-change] Processing workspace change:`, {
      workspaceId,
      sdkUserId: userData.sdkUserId,
      userRole,
    });

    // 1. Sync workspace to database
    const workspaceSyncResult = await syncWorkspace({
      id: workspaceId,
      name: workspace.name || `Workspace ${workspaceId}`,
      image: workspace.image,
      slug: workspace.slug,
      description: workspace.description,
      role: userRole,
      ...(workspace.features !== undefined && { features: workspace.features }),
      ...(workspace.limits !== undefined && { limits: workspace.limits }),
    });

    if (!workspaceSyncResult.success || !workspaceSyncResult.workspace) {
      console.error(`[workspace-change] Failed to sync workspace:`, workspaceSyncResult.error);
      return NextResponse.json(
        {
          success: false,
          error: workspaceSyncResult.error || "Failed to sync workspace",
        },
        { status: 500 }
      );
    }

    const syncedWorkspace = workspaceSyncResult.workspace;
    console.log(`[workspace-change] Workspace synced successfully:`, syncedWorkspace.id);

    // 2. Ensure user is added to workspace with correct role
    const membershipResult = await addUserToWorkspace(userData.sdkUserId, workspaceId, userRole);

    if (!membershipResult.success) {
      console.error(`[workspace-change] Failed to add user to workspace:`, membershipResult.error);
      // Continue anyway - workspace sync succeeded
    } else {
      console.log(`[workspace-change] User added to workspace with role:`, userRole);
    }

    // 3. Update user's current workspace preference
    await updateUserCurrentWorkspace(userData.sdkUserId, workspaceId, userRole);
    console.log(`[workspace-change] User's current workspace updated`);

    // 4. Create updated user data with new workspace context
    // IMPORTANT: Keep the app role (user/admin) separate from workspace role (viewer/editor/admin)
    // The app role is used by withServerAuth, workspace role is for permission checks
    const updatedUserData = {
      ...userData,
      workspaceId: workspaceId,
      workspaceName: workspace.name || syncedWorkspace.name,
      workspaceRole: userRole, // Workspace-level role for permission checks
      // role: userData.role is preserved from spread - this is the app role (user/admin)
    };

    // 5. Generate new auth token with updated workspace context
    return createResponseWithAuthToken(
      {
        success: true,
        user: updatedUserData,
        workspace: syncedWorkspace,
        message: "Workspace changed and token updated successfully",
      },
      updatedUserData
    );
  } catch (error) {
    console.error("[workspace-change] Error processing workspace change:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to change workspace",
      },
      { status: 500 }
    );
  }
}

export const POST = withAuth(postHandler);
