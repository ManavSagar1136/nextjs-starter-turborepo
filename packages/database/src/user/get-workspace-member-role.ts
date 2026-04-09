import { prisma } from "../index";

/**
 * Get a user's role in a specific workspace.
 * Returns null if user or workspace is not found, or membership doesn't exist.
 */
export const getWorkspaceMemberRole = async (sdkUserId: string, sdkWorkspaceId: string) => {
  try {
    const user = await prisma.user.findUnique({ where: { sdkUserId } });
    if (!user) return { success: false, role: null, error: "User not found" };

    const workspace = await prisma.workspace.findUnique({ where: { sdkWorkspaceId } });
    if (!workspace) return { success: false, role: null, error: "Workspace not found" };

    const membership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: user.id, workspaceId: workspace.id } },
    });

    return { success: true, role: membership?.role ?? null };
  } catch (error) {
    console.error("Error fetching workspace member role:", error);
    return { success: false, role: null, error: "Failed to fetch membership" };
  }
};
