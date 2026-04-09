import { prisma } from "../index";

/**
 * Soft-delete a user's membership from a workspace.
 * Sets isActive=false and records removedAt timestamp.
 *
 * @returns wasCurrentWorkspace — true if the removed workspace was the user's active workspace,
 *   so the caller knows to clear currentWorkspaceId and refresh the JWT.
 */
export const removeUserFromWorkspace = async (sdkUserId: string, sdkWorkspaceId: string) => {
  try {
    const user = await prisma.user.findUnique({ where: { sdkUserId } });
    if (!user) return { success: false, error: "User not found" };

    const workspace = await prisma.workspace.findUnique({ where: { sdkWorkspaceId } });
    if (!workspace) return { success: false, error: "Workspace not found" };

    const membership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: user.id, workspaceId: workspace.id } },
    });

    if (!membership) {
      return { success: true, wasCurrentWorkspace: false, message: "User was not a member" };
    }

    await prisma.workspaceMember.update({
      where: { userId_workspaceId: { userId: user.id, workspaceId: workspace.id } },
      data: { isActive: false, removedAt: new Date(), updatedAt: new Date() },
    });

    // Determine if this was the user's active workspace
    const isCurrentWorkspace = user.currentWorkspaceId === workspace.id;
    if (isCurrentWorkspace) {
      await prisma.user.update({
        where: { sdkUserId },
        data: { currentWorkspaceId: null },
      });
    }

    return { success: true, wasCurrentWorkspace: isCurrentWorkspace, workspace };
  } catch (error) {
    console.error("Error removing user from workspace:", error);
    return { success: false, error: "Failed to remove user from workspace" };
  }
};
