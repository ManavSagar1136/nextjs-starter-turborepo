import { prisma } from "../index";

/**
 * Get workspace with its members
 */
export const getWorkspaceWithMembers = async (sdkWorkspaceId: string) => {
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { sdkWorkspaceId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    return { success: true, workspace };
  } catch (error) {
    console.error("Error fetching workspace with members:", error);
    return { success: false, error: "Failed to fetch workspace" };
  }
};
