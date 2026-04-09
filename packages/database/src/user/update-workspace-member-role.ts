import { prisma } from "../index";

/**
 * Set (or create) a user's role in a workspace.
 * Uses upsert so it works whether the membership already exists or not.
 */
export const updateWorkspaceMemberRole = async (sdkUserId: string, sdkWorkspaceId: string, newRole: string) => {
  try {
    const user = await prisma.user.findUnique({ where: { sdkUserId } });
    if (!user) return { success: false, error: "User not found" };

    const workspace = await prisma.workspace.findUnique({ where: { sdkWorkspaceId } });
    if (!workspace) return { success: false, error: "Workspace not found" };

    const membership = await prisma.workspaceMember.upsert({
      where: { userId_workspaceId: { userId: user.id, workspaceId: workspace.id } },
      update: {
        role: newRole,
        isActive: true,
        removedAt: null,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        workspaceId: workspace.id,
        role: newRole,
        isActive: true,
      },
    });

    return { success: true, membership };
  } catch (error) {
    console.error("Error updating workspace member role:", error);
    return { success: false, error: "Failed to update workspace member role" };
  }
};
