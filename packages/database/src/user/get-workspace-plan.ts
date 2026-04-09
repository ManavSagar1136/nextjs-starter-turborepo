import { prisma } from "../index";

/**
 * Fetch subscription status and plan snapshot for a workspace.
 *
 * Used by withPlanCheck to enforce feature flags, hard-cap limits, and
 * subscription gating without loading workspace relations.
 *
 * @param dbWorkspaceId - Prisma ObjectId (set by withPermissionCheck as req.dbWorkspaceId)
 */
export const getWorkspacePlan = async (dbWorkspaceId: string) => {
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: dbWorkspaceId },
      select: { subscriptionStatus: true, features: true, limits: true },
    });
    return { success: true, workspace };
  } catch (error) {
    console.error("Error fetching workspace plan:", error);
    return { success: false, workspace: null, error: "Failed to fetch workspace plan" };
  }
};
