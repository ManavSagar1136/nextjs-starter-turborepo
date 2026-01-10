import { NextRequest, NextResponse } from "next/server";
import { AuthenticatedUser, withAuth } from "@buildbase/helpers/auth";
import {
  syncWorkspace,
  syncUser,
  addUserToWorkspace,
  updateUserCurrentWorkspace,
  DEFAULT_ROLE,
  WORKSPACE_ROLES,
} from "@buildbase/database/user";
import { createResponseWithAuthToken } from "@buildbase/helpers/auth";
import { prisma } from "@buildbase/database";

async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    let { eventType, workspace, previousWorkspace, userId, role, previousRole, newRole } = body;

    console.log(`[workspace-event] Received event:`, {
      eventType,
      hasWorkspace: !!workspace,
      workspaceKeys: workspace ? Object.keys(workspace) : [],
      userId,
      role,
      bodyKeys: Object.keys(body),
    });

    if (!eventType) {
      return NextResponse.json({ error: "eventType is required" }, { status: 400 });
    }

    // For workspace:deleted, the workspace might be nested inside workspace.workspace
    if (eventType === "workspace:deleted" && workspace && workspace.workspace) {
      console.log(`[workspace-event] Detected nested workspace structure for deleted event`);
      workspace = workspace.workspace;
    }

    // For workspace:deleted, workspace might be the data directly
    if (!workspace && eventType !== "workspace:deleted") {
      return NextResponse.json({ error: "workspace is required" }, { status: 400 });
    }

    if (
      eventType !== "workspace:created" &&
      eventType !== "workspace:changed" &&
      eventType !== "workspace:updated" &&
      eventType !== "workspace:deleted" &&
      eventType !== "workspace:user-added" &&
      eventType !== "workspace:user-removed" &&
      eventType !== "workspace:user-role-changed"
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid eventType. Must be 'workspace:created', 'workspace:changed', 'workspace:updated', 'workspace:deleted', 'workspace:user-added', 'workspace:user-removed', or 'workspace:user-role-changed'",
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
      // Sometimes the workspace data might be at the root level
      workspaceId = body.id || body._id || body.workspaceId;
      if (workspaceId) {
        console.log(`[workspace-event] Found workspace ID at root level for deleted event:`, workspaceId);
      }
    }

    console.log(`[workspace-event] Extracted workspace ID:`, workspaceId, {
      workspaceId: workspace?.id,
      workspace_id: workspace?._id,
      workspaceWorkspaceId: workspace?.workspaceId,
      bodyId: body.id,
      body_id: body._id,
      bodyWorkspaceId: body.workspaceId,
    });

    if (!workspaceId) {
      console.error(`[workspace-event] Failed to extract workspace ID. Body:`, JSON.stringify(body, null, 2));
      return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
    }

    // For workspace:deleted, handle deletion directly (skip normal sync)
    if (eventType === "workspace:deleted") {
      try {
        console.log(`[workspace-event] Handling workspace:deleted for workspace ID:`, workspaceId);

        // Find the workspace in our database
        const existingWorkspace = await prisma.workspace.findUnique({
          where: { sdkWorkspaceId: workspaceId },
        });

        console.log(`[workspace-event] Existing workspace found:`, !!existingWorkspace);

        if (!existingWorkspace) {
          // Workspace doesn't exist in our DB, nothing to delete
          return NextResponse.json({
            success: true,
            message: "Workspace not found in database, nothing to delete",
          });
        }

        // Mark workspace as inactive (soft delete)
        await prisma.workspace.update({
          where: { sdkWorkspaceId: workspaceId },
          data: {
            isActive: false,
            updatedAt: new Date(),
          },
        });

        // Mark all workspace memberships as inactive
        await prisma.workspaceMember.updateMany({
          where: { workspaceId: existingWorkspace.id },
          data: {
            isActive: false,
            removedAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // If this was the current user's active workspace, clear it and update token
        const isCurrentWorkspace = userData.workspaceId === workspaceId;
        if (isCurrentWorkspace && userData.sdkUserId) {
          // Clear current workspace preference
          await prisma.user.updateMany({
            where: { sdkUserId: userData.sdkUserId },
            data: {
              currentWorkspaceId: null,
            },
          });

          // Create response with updated token (without workspace reference)
          return createResponseWithAuthToken(
            {
              success: true,
              user: {
                ...userData,
                workspaceId: undefined,
                workspaceName: undefined,
              },
              message: "Workspace deleted and token updated successfully",
            },
            {
              ...userData,
              workspaceId: undefined,
              workspaceName: undefined,
            }
          );
        }

        return NextResponse.json({
          success: true,
          message: "Workspace deleted and synced successfully",
        });
      } catch (error) {
        console.error("Error deleting workspace:", error);
        return NextResponse.json({ error: "Failed to delete workspace" }, { status: 500 });
      }
    }

    // Sync workspace to database (upsert will create if doesn't exist)
    // This MUST succeed before we can add users to the workspace
    console.log(`[workspace-event] Syncing workspace ${workspaceId} for event ${eventType}`);
    let workspaceSyncResult = await syncWorkspace({
      id: workspaceId,
      name: workspace.name || `Workspace ${workspaceId}`,
      image: workspace.image,
      slug: workspace.slug,
    });

    console.log(`[workspace-event] Initial sync result:`, {
      success: workspaceSyncResult.success,
      hasWorkspace: !!workspaceSyncResult.workspace,
      error: workspaceSyncResult.error,
    });

    // If workspace sync failed, retry it before proceeding
    if (!workspaceSyncResult.success || !workspaceSyncResult.workspace) {
      console.warn(`[workspace-event] Initial workspace sync failed, retrying... Error:`, workspaceSyncResult.error);
      workspaceSyncResult = await syncWorkspace({
        id: workspaceId,
        name: workspace.name || `Workspace ${workspaceId}`,
        image: workspace.image,
        slug: workspace.slug,
      });
      console.log(`[workspace-event] Retry sync result:`, {
        success: workspaceSyncResult.success,
        hasWorkspace: !!workspaceSyncResult.workspace,
        error: workspaceSyncResult.error,
      });
    }

    // If workspace still doesn't exist, try to fetch it from database
    let finalWorkspace = workspaceSyncResult.workspace;
    if (!finalWorkspace) {
      try {
        console.log(`[workspace-event] Workspace not in sync result, checking database...`);
        const fetchedWorkspace = await prisma.workspace.findUnique({
          where: { sdkWorkspaceId: workspaceId },
        });
        if (fetchedWorkspace) {
          console.log(`[workspace-event] Found workspace in database`);
          finalWorkspace = fetchedWorkspace;
        } else {
          // Last resort: try one more time to create the workspace
          console.warn(`[workspace-event] Workspace not found in database, attempting final sync...`);
          const finalSyncResult = await syncWorkspace({
            id: workspaceId,
            name: workspace.name || `Workspace ${workspaceId}`,
            image: workspace.image,
            slug: workspace.slug,
          });
          console.log(`[workspace-event] Final sync result:`, {
            success: finalSyncResult.success,
            hasWorkspace: !!finalSyncResult.workspace,
            error: finalSyncResult.error,
          });
          if (finalSyncResult.success && finalSyncResult.workspace) {
            finalWorkspace = finalSyncResult.workspace;
          } else {
            console.error(
              `[workspace-event] Failed to create workspace after multiple attempts. Error:`,
              finalSyncResult.error
            );
            // Don't return error - continue and try to create workspace during user sync
            console.warn(`[workspace-event] Continuing anyway - workspace may be created during user sync`);
          }
        }
      } catch (error) {
        console.error(`[workspace-event] Error fetching workspace:`, error);
        // Don't return error - continue and try to create workspace during user sync
        console.warn(`[workspace-event] Continuing anyway - workspace may be created during user sync`);
      }
    } else {
      console.log(`[workspace-event] Workspace successfully synced:`, finalWorkspace.id);
    }

    // Normalize users - handle both array of objects and array of IDs
    const workspaceUsers = workspace.users || [];
    const normalizedUsers: Array<{
      _id?: string;
      id?: string;
      name?: string;
      email?: string;
      image?: string;
      role?: string;
    }> = workspaceUsers.map((user: any) => {
      if (typeof user === "string") {
        return { _id: user, id: user };
      }
      return user;
    });

    // Sync all users in the workspace
    // Now that we've ensured the workspace exists, we can safely add users
    if (normalizedUsers.length > 0) {
      for (const workspaceUser of normalizedUsers) {
        try {
          const sdkUserId = workspaceUser._id || workspaceUser.id;
          if (!sdkUserId) {
            console.error("Invalid user data:", workspaceUser);
            continue;
          }

          // Determine user role
          let userRole = workspaceUser.role || DEFAULT_ROLE;

          // For workspace:created, check if user is the creator
          if (eventType === "workspace:created") {
            const createdBy = workspace.createdBy;
            const creatorId = typeof createdBy === "string" ? createdBy : createdBy?._id || createdBy?.id;
            if (sdkUserId === creatorId) {
              userRole = WORKSPACE_ROLES.ADMIN;
            }
          }

          // Sync user to database - DO NOT update user's base role during workspace events
          // Workspace membership role is stored separately in WorkspaceMember model
          await syncUser(
            {
              id: sdkUserId,
              email: workspaceUser.email,
              name: workspaceUser.name,
              image: workspaceUser.image,
              // role is intentionally omitted - user's base role should not be updated during workspace events
            },
            false
          ); // Explicitly set updateRole to false

          // Add user to workspace
          const membershipResult = await addUserToWorkspace(sdkUserId, workspaceId, userRole);
          if (!membershipResult.success) {
            console.warn(
              `[workspace-event] Failed to add user ${sdkUserId} to workspace ${workspaceId}:`,
              membershipResult.error
            );
            // If workspace doesn't exist, try to create it now
            const errorMsg = membershipResult.error?.toString() || "";
            if (errorMsg.includes("workspace not found") || errorMsg.includes("Workspace not found")) {
              console.log(`[workspace-event] Workspace not found when adding user, attempting to create...`);
              const emergencySyncResult = await syncWorkspace({
                id: workspaceId,
                name: workspace.name || `Workspace ${workspaceId}`,
                image: workspace.image,
                slug: workspace.slug,
              });
              if (emergencySyncResult.success && emergencySyncResult.workspace) {
                console.log(`[workspace-event] Workspace created during user sync, retrying add user...`);
                finalWorkspace = emergencySyncResult.workspace;
                // Retry adding user to workspace
                await addUserToWorkspace(sdkUserId, workspaceId, userRole);
              }
            }
          }
        } catch (error) {
          const userId = workspaceUser._id || workspaceUser.id;
          console.error(`Error syncing workspace user ${userId}:`, error);
          // Continue with other users even if one fails
        }
      }
    }

    // Ensure we have the workspace before proceeding
    // If we still don't have it, try one final fetch
    if (!finalWorkspace) {
      try {
        const fetchedWorkspace = await prisma.workspace.findUnique({
          where: { sdkWorkspaceId: workspaceId },
        });
        if (fetchedWorkspace) {
          console.log(`[workspace-event] Found workspace after user sync`);
          finalWorkspace = fetchedWorkspace;
        } else {
          console.error(`[workspace-event] Workspace ${workspaceId} still not found after all attempts`);
        }
      } catch (error) {
        console.error(`[workspace-event] Error in final workspace fetch:`, error);
      }
    }

    // For workspace:changed and workspace:updated, check if we need to update token
    if (eventType === "workspace:changed" || eventType === "workspace:updated") {
      // Find current user's role in this workspace
      let currentUserRole = userData.role || DEFAULT_ROLE;

      const currentUserInWorkspace = normalizedUsers.find((u: any) => {
        const userId = u._id || u.id;
        return userId === userData.sdkUserId;
      });

      if (currentUserInWorkspace) {
        currentUserRole = currentUserInWorkspace.role || currentUserRole;
      }

      // Ensure current user is added to workspace
      if (userData.sdkUserId) {
        const membershipResult = await addUserToWorkspace(userData.sdkUserId, workspaceId, currentUserRole);

        if (!membershipResult.success) {
          console.error("Failed to add user to workspace:", membershipResult.error);
        }

        // For workspace:changed, update user's current workspace preference
        if (eventType === "workspace:changed") {
          await updateUserCurrentWorkspace(userData.sdkUserId, workspaceId);
        }
      }

      // Check if this is the current user's active workspace
      const isCurrentWorkspace = userData.workspaceId === workspaceId;

      // Recreate token if:
      // 1. It's workspace:changed (always update token)
      // 2. It's workspace:updated AND it's the current workspace (workspace name/role might have changed)
      if (eventType === "workspace:changed" || (eventType === "workspace:updated" && isCurrentWorkspace)) {
        // Create response with updated token
        const updatedUserData = {
          ...userData,
          workspaceId: eventType === "workspace:changed" ? workspaceId : userData.workspaceId,
          workspaceName: workspace.name || userData.workspaceName,
          role: currentUserRole,
        };

        return createResponseWithAuthToken(
          {
            success: true,
            user: updatedUserData,
            workspace: finalWorkspace || workspaceSyncResult.workspace || undefined,
            message:
              eventType === "workspace:changed"
                ? "Workspace changed and token updated successfully"
                : "Workspace updated and token refreshed successfully",
          },
          updatedUserData
        );
      }

      // For workspace:updated when it's not the current workspace, just return success
      return NextResponse.json({
        success: true,
        workspace: finalWorkspace || workspaceSyncResult.workspace,
        message: "Workspace updated and synced successfully",
      });
    }

    // For workspace:created, just return success (no token recreation needed)
    if (eventType === "workspace:created") {
      return NextResponse.json({
        success: true,
        workspace: finalWorkspace || workspaceSyncResult.workspace,
        message: "Workspace created and synced successfully",
      });
    }

    // For workspace:user-added, handle user addition to workspace
    if (eventType === "workspace:user-added") {
      console.log(
        `[workspace-event] Handling workspace:user-added. userId: ${userId}, workspaceId: ${workspaceId}, role: ${role}`
      );
      console.log(`[workspace-event] Full body:`, JSON.stringify(body, null, 2));

      if (!userId) {
        console.error(`[workspace-event] userId is missing. Body keys:`, Object.keys(body));
        return NextResponse.json({ error: "userId is required for workspace:user-added event" }, { status: 400 });
      }

      // Ensure workspace exists
      if (!finalWorkspace) {
        console.warn(`[workspace-event] Workspace not found for user-added event, attempting to sync...`);
        const workspaceSyncResult = await syncWorkspace({
          id: workspaceId,
          name: workspace.name || `Workspace ${workspaceId}`,
          image: workspace.image,
          slug: workspace.slug,
        });

        if (workspaceSyncResult.success && workspaceSyncResult.workspace) {
          finalWorkspace = workspaceSyncResult.workspace;
        } else {
          // Try to fetch from database
          try {
            const fetchedWorkspace = await prisma.workspace.findUnique({
              where: { sdkWorkspaceId: workspaceId },
            });
            if (fetchedWorkspace) {
              finalWorkspace = fetchedWorkspace;
            } else {
              return NextResponse.json({ error: "Workspace not found and could not be created" }, { status: 404 });
            }
          } catch (error) {
            console.error(`[workspace-event] Error fetching workspace:`, error);
            return NextResponse.json({ error: "Failed to sync workspace" }, { status: 500 });
          }
        }
      }

      // Get user data from workspace.users array or use the provided userId
      const workspaceUsers = workspace.users || [];
      const targetUser = workspaceUsers.find((u: any) => {
        const uId = u._id || u.id;
        return uId === userId;
      });

      // Sync the user to database - DO NOT update user's base role during workspace events
      if (targetUser) {
        await syncUser(
          {
            id: userId,
            email: targetUser.email,
            name: targetUser.name,
            image: targetUser.image,
            // role is intentionally omitted - user's base role should not be updated during workspace events
          },
          false
        ); // Explicitly set updateRole to false
      } else {
        // If user not in workspace.users, still try to sync with minimal data
        await syncUser(
          {
            id: userId,
            email: undefined,
            name: undefined,
            image: undefined,
            // role is intentionally omitted - will default to APP_ROLES.USER on creation
          },
          false
        ); // Do not update role during workspace events
      }

      // Add user to workspace with the specified role
      const userRole = role || targetUser?.role || DEFAULT_ROLE;
      const membershipResult = await addUserToWorkspace(userId, workspaceId, userRole);

      if (!membershipResult.success) {
        console.error(`[workspace-event] Failed to add user to workspace:`, membershipResult.error);
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

    // For workspace:user-removed, handle user removal from workspace
    if (eventType === "workspace:user-removed") {
      console.log(`[workspace-event] Handling workspace:user-removed for user ${userId} from workspace ${workspaceId}`);

      if (!userId) {
        return NextResponse.json({ error: "userId is required for workspace:user-removed event" }, { status: 400 });
      }

      try {
        // Get user and workspace by their SDK IDs
        const user = await prisma.user.findUnique({
          where: { sdkUserId: userId },
        });

        if (!user) {
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Find workspace
        const targetWorkspace =
          finalWorkspace ||
          (await prisma.workspace.findUnique({
            where: { sdkWorkspaceId: workspaceId },
          }));

        if (!targetWorkspace) {
          return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
        }

        // Find the workspace membership
        const membership = await prisma.workspaceMember.findUnique({
          where: {
            userId_workspaceId: {
              userId: user.id,
              workspaceId: targetWorkspace.id,
            },
          },
        });

        if (!membership) {
          // Membership doesn't exist, nothing to remove
          return NextResponse.json({
            success: true,
            message: "User was not a member of the workspace",
          });
        }

        // Soft delete the membership (mark as inactive)
        await prisma.workspaceMember.update({
          where: {
            userId_workspaceId: {
              userId: user.id,
              workspaceId: targetWorkspace.id,
            },
          },
          data: {
            isActive: false,
            removedAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // If this was the user's current workspace, clear it
        if (userData.sdkUserId === userId && userData.workspaceId === workspaceId) {
          await prisma.user.update({
            where: { sdkUserId: userId },
            data: {
              currentWorkspaceId: null,
            },
          });

          // If it's the current authenticated user, update their token
          if (userData.sdkUserId === userId) {
            // Create response with updated token (without workspace reference)
            return createResponseWithAuthToken(
              {
                success: true,
                workspace: targetWorkspace,
                message: "User removed from workspace and token updated successfully",
              },
              {
                ...userData,
                workspaceId: undefined,
                workspaceName: undefined,
              }
            );
          }
        }

        return NextResponse.json({
          success: true,
          workspace: targetWorkspace,
          message: "User removed from workspace successfully",
        });
      } catch (error) {
        console.error(`[workspace-event] Error removing user from workspace:`, error);
        return NextResponse.json({ error: "Failed to remove user from workspace" }, { status: 500 });
      }
    }

    // For workspace:user-role-changed, handle user role update in workspace
    if (eventType === "workspace:user-role-changed") {
      console.log(
        `[workspace-event] Handling workspace:user-role-changed for user ${userId} in workspace ${workspaceId}. Previous role: ${previousRole}, New role: ${newRole}`
      );

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
        // Get user and workspace by their SDK IDs
        const user = await prisma.user.findUnique({
          where: { sdkUserId: userId },
        });

        if (!user) {
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Find workspace
        const targetWorkspace =
          finalWorkspace ||
          (await prisma.workspace.findUnique({
            where: { sdkWorkspaceId: workspaceId },
          }));

        if (!targetWorkspace) {
          return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
        }

        // Find or create the workspace membership directly (avoid using addUserToWorkspace which has default role)
        // Use upsert to handle both create and update in a single atomic operation
        const updatedMembership = await prisma.workspaceMember.upsert({
          where: {
            userId_workspaceId: {
              userId: user.id,
              workspaceId: targetWorkspace.id,
            },
          },
          update: {
            role: newRole, // Directly set the new role without any intermediate default
            isActive: true, // Ensure membership is active
            removedAt: null, // Clear removal timestamp if it was set
            updatedAt: new Date(),
          },
          create: {
            userId: user.id,
            workspaceId: targetWorkspace.id,
            role: newRole, // Directly set the new role without any intermediate default
            isActive: true,
          },
        });

        // If this is the current authenticated user and it's their active workspace, update token
        if (userData.sdkUserId === userId && userData.workspaceId === workspaceId) {
          // Create response with updated token (with new role)
          return createResponseWithAuthToken(
            {
              success: true,
              workspace: targetWorkspace,
              membership: updatedMembership,
              message: "User role updated in workspace and token refreshed successfully",
            },
            {
              ...userData,
              role: newRole,
            }
          );
        }

        return NextResponse.json({
          success: true,
          workspace: targetWorkspace,
          membership: updatedMembership,
          message: "User role updated in workspace successfully",
        });
      } catch (error) {
        console.error(`[workspace-event] Error updating user role in workspace:`, error);
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
    console.error("Workspace event handler error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const POST = withAuth(postHandler);
