import { prisma } from "../index";
import type { SDKWorkspaceData } from "./types";
import { DEFAULT_ROLE } from "./constants";

/**
 * Sync all workspaces for a user
 * This ensures all user workspaces are stored in the database
 * Uses transactions for data consistency
 */
export const syncAllWorkspaces = async (
  sdkUserId: string,
  workspaces: SDKWorkspaceData[],
  defaultWorkspaceId?: string
) => {
  try {
    // Get user first
    const user = await prisma.user.findUnique({
      where: { sdkUserId },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
        workspaces: [],
        memberships: [],
        syncedCount: 0,
        totalCount: workspaces.length,
      };
    }

    // Use transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async tx => {
      const syncedWorkspaces = [];
      const memberships = [];

      // Sync each workspace
      for (const workspaceData of workspaces) {
        try {
          // Sync workspace to database
          const workspace = await tx.workspace.upsert({
            where: { sdkWorkspaceId: workspaceData.id },
            update: {
              name: workspaceData.name,
              image: workspaceData.image || undefined,
              slug: workspaceData.slug || undefined,
              description: workspaceData.description || undefined,
              isActive: true,
              updatedAt: new Date(),
            },
            create: {
              sdkWorkspaceId: workspaceData.id,
              name: workspaceData.name,
              image: workspaceData.image,
              slug: workspaceData.slug,
              description: workspaceData.description,
              isActive: true,
            },
          });

          syncedWorkspaces.push(workspace);

          // Create or update workspace membership
          const membership = await tx.workspaceMember.upsert({
            where: {
              userId_workspaceId: {
                userId: user.id,
                workspaceId: workspace.id,
              },
            },
            update: {
              role: workspaceData.role || DEFAULT_ROLE,
              isActive: true,
              removedAt: null,
              updatedAt: new Date(),
            },
            create: {
              userId: user.id,
              workspaceId: workspace.id,
              role: workspaceData.role || DEFAULT_ROLE,
              isActive: true,
            },
          });

          memberships.push(membership);
        } catch (error) {
          console.error(`Error syncing workspace ${workspaceData.id}:`, error);
          // Continue with other workspaces even if one fails
        }
      }

      // Update user's current workspace if provided — only if the workspace is still active.
      // Soft-deleted workspaces (isActive=false) remain in DB but must not be set as current.
      if (defaultWorkspaceId) {
        const defaultWorkspace = await tx.workspace.findUnique({
          where: { sdkWorkspaceId: defaultWorkspaceId },
        });

        if (defaultWorkspace && defaultWorkspace.isActive) {
          await tx.user.update({
            where: { sdkUserId },
            data: { currentWorkspaceId: defaultWorkspace.id },
          });
        } else if (defaultWorkspace && !defaultWorkspace.isActive) {
          // Workspace was deleted — clear the stale pointer
          await tx.user.updateMany({
            where: { sdkUserId, currentWorkspaceId: defaultWorkspace.id },
            data: { currentWorkspaceId: null },
          });
        }
      }

      return {
        success: true,
        workspaces: syncedWorkspaces,
        memberships,
        syncedCount: syncedWorkspaces.length,
        totalCount: workspaces.length,
      };
    });

    return result;
  } catch (error) {
    console.error("Error syncing all workspaces:", error);
    return {
      success: false,
      error: "Failed to sync workspaces",
      workspaces: [],
      memberships: [],
      syncedCount: 0,
      totalCount: workspaces.length,
    };
  }
};
