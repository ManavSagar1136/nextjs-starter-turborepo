import { prisma } from "../index";
import { type WorkspaceRole } from "./constants";

/**
 * Add user to workspace (create workspace membership)
 */
export const addUserToWorkspace = async (userId: string, workspaceId: string, role: WorkspaceRole | string) => {
  try {
    // First, get the user and workspace by their SDK IDs
    const user = await prisma.user.findUnique({
      where: { sdkUserId: userId },
    });

    const workspace = await prisma.workspace.findUnique({
      where: { sdkWorkspaceId: workspaceId },
    });

    if (!user || !workspace) {
      return {
        success: false,
        error: "User or workspace not found",
      };
    }

    // Create or update workspace membership
    const membership = await prisma.workspaceMember.upsert({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: workspace.id,
        },
      },
      update: {
        role,
        isActive: true, // Reactivate if previously removed
        removedAt: null, // Clear removal timestamp
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        workspaceId: workspace.id,
        role,
        isActive: true,
      },
    });

    return { success: true, membership };
  } catch (error) {
    console.error("Error adding user to workspace:", error);
    return { success: false, error: "Failed to add user to workspace" };
  }
};
