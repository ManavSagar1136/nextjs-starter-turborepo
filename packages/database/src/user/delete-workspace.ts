import { prisma } from "../index";

/**
 * Soft-delete a workspace and clean up all connected state.
 *
 * Actions:
 *   - Workspace.isActive = false
 *   - All WorkspaceMember rows: isActive = false, removedAt = now
 *   - All ApiKey rows: isActive = false (security — keys for deleted workspaces must stop working)
 *   - ALL User.currentWorkspaceId that pointed here: set to null
 *     (handles offline users — not just the calling user)
 *
 */
export const deleteWorkspace = async (sdkWorkspaceId: string) => {
  try {
    const workspace = await prisma.workspace.findUnique({ where: { sdkWorkspaceId } });

    if (!workspace) {
      return { success: true, workspace: null, message: "Workspace not found, nothing to delete" };
    }

    // Soft-delete the workspace itself
    await prisma.workspace.update({
      where: { sdkWorkspaceId },
      data: { isActive: false, updatedAt: new Date() },
    });

    // Soft-delete all memberships
    await prisma.workspaceMember.updateMany({
      where: { workspaceId: workspace.id },
      data: { isActive: false, removedAt: new Date(), updatedAt: new Date() },
    });

    // Deactivate all API keys — keys for a deleted workspace must not authenticate
    await prisma.apiKey.updateMany({
      where: { workspaceId: workspace.id, isActive: true },
      data: { isActive: false, revokedAt: new Date(), updatedAt: new Date() },
    });

    // Clear currentWorkspaceId for EVERY user who pointed to this workspace
    // (not just the caller — handles members who are currently offline)
    await prisma.user.updateMany({
      where: { currentWorkspaceId: workspace.id },
      data: { currentWorkspaceId: null },
    });

    return { success: true, workspace };
  } catch (error) {
    console.error("Error deleting workspace:", error);
    return { success: false, workspace: null, error: "Failed to delete workspace" };
  }
};
