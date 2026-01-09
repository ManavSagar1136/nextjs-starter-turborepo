import { prisma } from "../index";

/**
 * Get user with their workspaces
 */
export const getUserWithWorkspaces = async (sdkUserId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { sdkUserId },
      include: {
        workspaces: {
          include: {
            workspace: true,
          },
        },
      },
    });

    return { success: true, user };
  } catch (error) {
    console.error("Error fetching user with workspaces:", error);
    return { success: false, error: "Failed to fetch user" };
  }
};
