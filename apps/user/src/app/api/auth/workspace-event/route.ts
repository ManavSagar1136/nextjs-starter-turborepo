import { NextRequest, NextResponse } from "next/server";
import { AuthenticatedUser, withAuth } from "@buildbase/helpers/auth";
import {
  syncWorkspace,
  syncUser,
  addUserToWorkspace,
  deleteWorkspace,
  removeUserFromWorkspace,
  updateWorkspaceMemberRole,
  getWorkspaceMemberRole,
  getWorkspaceBySdkId,
  DEFAULT_ROLE,
  WORKSPACE_ROLES,
} from "@buildbase/database/user";
import { createResponseWithAuthToken } from "@buildbase/helpers/auth";

async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    let { eventType, workspace, previousWorkspace, userId, role, previousRole, newRole } = body;

    if (!eventType) {
      return NextResponse.json({ error: "eventType is required" }, { status: 400 });
    }

    // For workspace:deleted, the workspace might be nested inside workspace.workspace
    if (eventType === "workspace:deleted" && workspace && workspace.workspace) {
      workspace = workspace.workspace;
    }

    // For workspace:deleted, workspace might be the data directly
    if (!workspace && eventType !== "workspace:deleted") {
      return NextResponse.json({ error: "workspace is required" }, { status: 400 });
    }

    if (
      eventType !== "workspace:created" &&
      eventType !== "workspace:updated" &&
      eventType !== "workspace:deleted" &&
      eventType !== "workspace:user-added" &&
      eventType !== "workspace:user-removed" &&
      eventType !== "workspace:user-role-changed"
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid eventType. Must be 'workspace:created', 'workspace:updated', 'workspace:deleted', 'workspace:user-added', 'workspace:user-removed', or 'workspace:user-role-changed'. Note: 'workspace:changed' is handled by /api/auth/workspace-change",
        },
        { status: 400 }
      );
    }

    const userData = (request as any).authenticatedUser as AuthenticatedUser;

    // Extract workspace ID - try multiple possible fields
    let workspaceId: string | undefined;
    if (workspace) {
      workspaceId = workspace.id || workspace._id || workspace.workspaceId;
    }

    // For workspace:deleted, if workspace is not provided, check if the body itself is the workspace
    if (!workspaceId && eventType === "workspace:deleted") {
      workspaceId = body.id || body._id || body.workspaceId;
    }

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
    }

    // ─── workspace:deleted ────────────────────────────────────────────────────
    if (eventType === "workspace:deleted") {
      try {
        // Only workspace admins call deleteWorkspace — non-admins just refresh their JWT.
        // Check role before calling deleteWorkspace; after deletion the membership is gone.
        const callerRoleResult = userData.sdkUserId
          ? await getWorkspaceMemberRole(userData.sdkUserId, workspaceId)
          : { role: null };
        const isWorkspaceAdmin = callerRoleResult.role === WORKSPACE_ROLES.ADMIN;

        if (isWorkspaceAdmin) {
          // deleteWorkspace is idempotent — "not found" just means another caller already ran it.
          // Do NOT return early here; fall through to JWT refresh so the admin's token is also cleared.
          await deleteWorkspace(workspaceId);
        }

        // All users (admin + non-admin) refresh JWT if this was their active workspace.
        // Use JWT state — deleteWorkspace may have already cleared DB state.
        if (userData.workspaceId === workspaceId) {
          return createResponseWithAuthToken(
            {
              success: true,
              user: { ...userData, workspaceId: undefined, workspaceName: undefined },
              message: "Workspace deleted and token updated successfully",
            },
            { ...userData, workspaceId: undefined, workspaceName: undefined }
          );
        }

        return NextResponse.json({ success: true, message: "Workspace deleted and synced successfully" });
      } catch (error) {
        return NextResponse.json({ error: "Failed to delete workspace" }, { status: 500 });
      }
    }

    // ─── workspace:created ────────────────────────────────────────────────────
    // Handled BEFORE the admin guard: the workspace doesn't exist in DB yet when this
    // event fires, so getWorkspaceMemberRole would return null and the guard would
    // incorrectly block the entire sync. The creator is always the workspace admin —
    // trust workspace.createdBy from the SDK payload.
    if (eventType === "workspace:created") {
      // Extract subscriptionStatus from Buildbase workspace payload.
      // workspace.subscription may be an ISubscription object or just an ID string.
      const rawSubscription = workspace.subscription;
      const subscriptionStatus =
        rawSubscription && typeof rawSubscription === "object"
          ? ((rawSubscription as any).subscriptionStatus ?? null)
          : null;

      const workspacePayloadCreated = {
        id: workspaceId,
        name: workspace.name || `Workspace ${workspaceId}`,
        image: workspace.image,
        slug: workspace.slug,
        // subscriptionStatus is the authoritative check in withPlanCheck.
        // null = no subscription yet = all plan-gated routes blocked.
        subscriptionStatus,
        features: workspace.features ?? null,
        limits: workspace.limits ?? null,
      };

      let createdWorkspace = (await syncWorkspace(workspacePayloadCreated)).workspace;
      if (!createdWorkspace) {
        createdWorkspace = (await syncWorkspace(workspacePayloadCreated)).workspace;
      }

      const workspaceUsers = workspace.users || [];
      const normalizedUsers: Array<{ _id?: string; id?: string; name?: string; email?: string; image?: string }> =
        workspaceUsers.map((u: any) => (typeof u === "string" ? { _id: u, id: u } : u));

      if (normalizedUsers.length > 0) {
        const createdBy = workspace.createdBy;
        const creatorId = typeof createdBy === "string" ? createdBy : createdBy?._id || createdBy?.id;

        for (const workspaceUser of normalizedUsers) {
          try {
            const sdkUserId = workspaceUser._id || workspaceUser.id;
            if (!sdkUserId) {
              continue;
            }

            const userRole: string = sdkUserId === creatorId ? WORKSPACE_ROLES.ADMIN : DEFAULT_ROLE;

            await syncUser(
              { id: sdkUserId, email: workspaceUser.email, name: workspaceUser.name, image: workspaceUser.image },
              false
            );

            const membershipResult = await addUserToWorkspace(sdkUserId, workspaceId, userRole);
            if (!membershipResult.success) {
              // Emergency: workspace may not exist yet — try one more sync
              const errorMsg = membershipResult.error?.toString() || "";
              if (errorMsg.includes("workspace not found") || errorMsg.includes("Workspace not found")) {
                const emergencySync = await syncWorkspace(workspacePayloadCreated);
                if (emergencySync.success && emergencySync.workspace) {
                  createdWorkspace = emergencySync.workspace;
                  await addUserToWorkspace(sdkUserId, workspaceId, userRole);
                }
              }
            }
          } catch (error) {}
        }
      }

      return NextResponse.json({
        success: true,
        workspace: createdWorkspace,
        message: "Workspace created and synced successfully",
      });
    }

    // ─── Workspace admin guard ────────────────────────────────────────────────
    // Only workspace admins perform full DB sync. Viewers/editors only refresh their
    // own JWT for events that directly affect their session — the admin's call already
    // handles all DB state for the workspace.
    const callerRoleResult = userData.sdkUserId
      ? await getWorkspaceMemberRole(userData.sdkUserId, workspaceId)
      : { role: null };
    const isWorkspaceAdmin = callerRoleResult.role === WORKSPACE_ROLES.ADMIN;

    if (!isWorkspaceAdmin) {
      // workspace:updated — refresh JWT name if this is the caller's active workspace
      if (eventType === "workspace:updated" && userData.workspaceId === workspaceId) {
        const updatedUserData = {
          ...userData,
          workspaceName: workspace.name || userData.workspaceName,
        };
        return createResponseWithAuthToken(
          { success: true, message: "Workspace updated, token refreshed" },
          updatedUserData
        );
      }

      // workspace:user-removed — clear JWT workspace if the caller was removed from their active workspace
      if (
        eventType === "workspace:user-removed" &&
        userData.sdkUserId === userId &&
        userData.workspaceId === workspaceId
      ) {
        return createResponseWithAuthToken(
          { success: true, message: "Removed from workspace, token updated" },
          { ...userData, workspaceId: undefined, workspaceName: undefined }
        );
      }

      // workspace:user-role-changed — update JWT workspace role only if it's the caller's own role in their active workspace
      if (
        eventType === "workspace:user-role-changed" &&
        userData.sdkUserId === userId &&
        userData.workspaceId === workspaceId
      ) {
        return createResponseWithAuthToken(
          { success: true, message: "Role updated, token refreshed" },
          { ...userData, workspaceRole: newRole } // workspace-level role — never overwrite APP_ROLE (userData.role)
        );
      }

      // workspace:user-added — admin handles all DB ops; the added user gets context via workspace:change
      return NextResponse.json({ success: true, message: "Event acknowledged" });
    }

    // ─── Admin path: full DB sync ─────────────────────────────────────────────
    // Persist subscriptionStatus + features/limits on workspace:updated so plan
    // enforcement always reflects the current Buildbase subscription state.
    const rawSub = workspace.subscription;
    const resolvedSubscriptionStatus =
      rawSub && typeof rawSub === "object" ? ((rawSub as any).subscriptionStatus ?? null) : null;

    const workspacePayload = {
      id: workspaceId,
      name: workspace.name || `Workspace ${workspaceId}`,
      image: workspace.image,
      slug: workspace.slug,
      subscriptionStatus: resolvedSubscriptionStatus,
      ...(workspace.features !== undefined && { features: workspace.features }),
      ...(workspace.limits !== undefined && { limits: workspace.limits }),
    };

    let workspaceSyncResult = await syncWorkspace(workspacePayload);

    // Retry once if initial sync failed
    if (!workspaceSyncResult.success || !workspaceSyncResult.workspace) {
      workspaceSyncResult = await syncWorkspace(workspacePayload);
    }

    // If still not synced, fall back to a DB fetch
    let finalWorkspace = workspaceSyncResult.workspace;
    if (!finalWorkspace) {
      try {
        const fetchResult = await getWorkspaceBySdkId(workspaceId);
        if (fetchResult.workspace) {
          finalWorkspace = fetchResult.workspace;
        } else {
          // Last resort: one more sync attempt
          const finalSyncResult = await syncWorkspace(workspacePayload);
          if (finalSyncResult.success && finalSyncResult.workspace) {
            finalWorkspace = finalSyncResult.workspace;
          } else {
          }
        }
      } catch (error) {}
    }

    // ─── workspace:updated ────────────────────────────────────────────────────
    if (eventType === "workspace:updated") {
      // Read workspace role from DB — IUser[].role is APP_ROLE, not workspace role.
      let currentUserRole = userData.role || DEFAULT_ROLE;

      if (userData.sdkUserId && finalWorkspace) {
        const roleResult = await getWorkspaceMemberRole(userData.sdkUserId, workspaceId);
        if (roleResult.role) {
          currentUserRole = roleResult.role;
        }
      }

      // Keep current user's membership active (workspace metadata changed, not role)
      if (userData.sdkUserId) {
        const membershipResult = await addUserToWorkspace(userData.sdkUserId, workspaceId, currentUserRole);
        if (!membershipResult.success) {
        }
      }

      const isCurrentWorkspace = userData.workspaceId === workspaceId;

      if (isCurrentWorkspace) {
        const updatedUserData = {
          ...userData,
          workspaceName: workspace.name || userData.workspaceName,
          workspaceRole: currentUserRole, // workspace-level role — never overwrite APP_ROLE (userData.role)
        };
        return createResponseWithAuthToken(
          {
            success: true,
            user: updatedUserData,
            workspace: finalWorkspace || workspaceSyncResult.workspace || undefined,
            message: "Workspace updated and token refreshed successfully",
          },
          updatedUserData
        );
      }

      return NextResponse.json({
        success: true,
        workspace: finalWorkspace || workspaceSyncResult.workspace,
        message: "Workspace updated and synced successfully",
      });
    }

    // ─── workspace:user-added ─────────────────────────────────────────────────
    if (eventType === "workspace:user-added") {
      if (!userId) {
        return NextResponse.json({ error: "userId is required for workspace:user-added event" }, { status: 400 });
      }

      // Ensure workspace exists
      if (!finalWorkspace) {
        const retrySync = await syncWorkspace(workspacePayload);
        if (retrySync.success && retrySync.workspace) {
          finalWorkspace = retrySync.workspace;
        } else {
          const fetchResult = await getWorkspaceBySdkId(workspaceId);
          if (fetchResult.workspace) {
            finalWorkspace = fetchResult.workspace;
          } else {
            return NextResponse.json({ error: "Workspace not found and could not be created" }, { status: 404 });
          }
        }
      }

      // Sync user profile (DO NOT pass role — IUser.role is APP_ROLE, not workspace role)
      const targetUser = (workspace.users || []).find((u: any) => (u._id || u.id) === userId);
      await syncUser(
        {
          id: userId,
          email: targetUser?.email,
          name: targetUser?.name,
          image: targetUser?.image,
        },
        false
      );

      // role from event body is the workspace role set by admin
      const userRole = role || DEFAULT_ROLE;
      const membershipResult = await addUserToWorkspace(userId, workspaceId, userRole);

      if (!membershipResult.success) {
        return NextResponse.json(
          { error: membershipResult.error || "Failed to add user to workspace" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        workspace: finalWorkspace,
        membership: membershipResult.membership,
        message: "User added to workspace successfully",
      });
    }

    // ─── workspace:user-removed ───────────────────────────────────────────────
    if (eventType === "workspace:user-removed") {
      if (!userId) {
        return NextResponse.json({ error: "userId is required for workspace:user-removed event" }, { status: 400 });
      }

      try {
        const result = await removeUserFromWorkspace(userId, workspaceId);

        if (!result.success) {
          const notFound = result.error === "User not found" || result.error === "Workspace not found";
          return NextResponse.json(
            { error: result.error || "Failed to remove user" },
            { status: notFound ? 404 : 500 }
          );
        }

        const targetWorkspace = finalWorkspace || result.workspace;

        // Use JWT state to decide if the calling user's token needs refreshing.
        // result.wasCurrentWorkspace may be false if a previous caller already cleared the DB state,
        // so we check what the calling user's JWT says their active workspace is.
        if (userData.sdkUserId === userId && userData.workspaceId === workspaceId) {
          return createResponseWithAuthToken(
            {
              success: true,
              workspace: targetWorkspace,
              message: "User removed from workspace and token updated successfully",
            },
            { ...userData, workspaceId: undefined, workspaceName: undefined }
          );
        }

        return NextResponse.json({
          success: true,
          workspace: targetWorkspace,
          message: result.message || "User removed from workspace successfully",
        });
      } catch (error) {
        return NextResponse.json({ error: "Failed to remove user from workspace" }, { status: 500 });
      }
    }

    // ─── workspace:user-role-changed ──────────────────────────────────────────
    if (eventType === "workspace:user-role-changed") {
      if (!userId) {
        return NextResponse.json(
          { error: "userId is required for workspace:user-role-changed event" },
          { status: 400 }
        );
      }

      if (!newRole) {
        return NextResponse.json(
          { error: "newRole is required for workspace:user-role-changed event" },
          { status: 400 }
        );
      }

      try {
        const result = await updateWorkspaceMemberRole(userId, workspaceId, newRole);

        if (!result.success) {
          return NextResponse.json(
            { error: result.error || "Failed to update role" },
            { status: result.error === "User not found" || result.error === "Workspace not found" ? 404 : 500 }
          );
        }

        const targetWorkspace = finalWorkspace;

        // If this is the affected user's own active workspace, refresh their JWT
        if (userData.sdkUserId === userId && userData.workspaceId === workspaceId) {
          return createResponseWithAuthToken(
            {
              success: true,
              workspace: targetWorkspace,
              membership: result.membership,
              message: "User role updated in workspace and token refreshed successfully",
            },
            { ...userData, workspaceRole: newRole } // workspace-level role — never overwrite APP_ROLE (userData.role)
          );
        }

        return NextResponse.json({
          success: true,
          workspace: targetWorkspace,
          membership: result.membership,
          message: "User role updated in workspace successfully",
        });
      } catch (error) {
        return NextResponse.json({ error: "Failed to update user role in workspace" }, { status: 500 });
      }
    }

    // Default response for any unhandled event types
    return NextResponse.json({
      success: true,
      workspace: finalWorkspace || workspaceSyncResult.workspace,
      message: "Workspace event processed successfully",
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const POST = withAuth(postHandler);
