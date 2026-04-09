import { prisma } from "../index";

/**
 * Clear a user's active workspace preference (set currentWorkspaceId to null).
 */
export const clearUserCurrentWorkspace = async (sdkUserId: string) => {
  try {
    await prisma.user.updateMany({
      where: { sdkUserId },
      data: { currentWorkspaceId: null },
    });
    return { success: true };
  } catch (error) {
    console.error("Error clearing user current workspace:", error);
    return { success: false, error: "Failed to clear current workspace" };
  }
};
