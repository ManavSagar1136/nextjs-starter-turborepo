import { prisma } from "../index";

/**
 * Find a workspace by its Buildbase SDK ID
 */
export const getWorkspaceBySdkId = async (sdkWorkspaceId: string) => {
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { sdkWorkspaceId },
    });
    return { success: true, workspace };
  } catch (error) {
    console.error("Error fetching workspace by SDK ID:", error);
    return { success: false, workspace: null, error: "Failed to fetch workspace" };
  }
};
