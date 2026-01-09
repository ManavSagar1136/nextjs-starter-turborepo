import { addUserToWorkspace } from "./add-user-to-workspace";
import { prisma } from "../index";

/**
 * Update user's current workspace preference
 * This can be stored in the user model or as a separate preference
 */
export const updateUserCurrentWorkspace = async (sdkUserId: string, sdkWorkspaceId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { sdkUserId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const workspace = await prisma.workspace.findUnique({
      where: { sdkWorkspaceId },
    });

    if (!workspace) {
      return { success: false, error: "Workspace not found" };
    }

    // Ensure membership exists
    const membershipResult = await addUserToWorkspace(sdkUserId, sdkWorkspaceId);

    if (!membershipResult.success) {
      return { success: false, error: "Failed to create membership" };
    }

    // Update user's current workspace
    // Using unchecked input to directly set currentWorkspaceId
    await prisma.user.update({
      where: { sdkUserId },
      data: {
        currentWorkspaceId: workspace.id,
      } as { currentWorkspaceId: string },
    });

    return { success: true, workspace };
  } catch (error) {
    console.error("Error updating user workspace:", error);
    return { success: false, error: "Failed to update workspace" };
  }
};
