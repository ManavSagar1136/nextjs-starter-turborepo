import { prisma } from "../index";
import type { SDKWorkspaceData } from "./types";

/**
 * Sync or create workspace from SDK data
 */
export const syncWorkspace = async (sdkWorkspaceData: SDKWorkspaceData) => {
  try {
    // First, check if workspace exists by sdkWorkspaceId
    const existingWorkspace = await prisma.workspace.findUnique({
      where: { sdkWorkspaceId: sdkWorkspaceData.id },
    });

    // If slug is provided, check if it conflicts with another workspace
    let slugToUse = sdkWorkspaceData.slug || undefined;
    if (slugToUse) {
      const slugConflict = await prisma.workspace.findUnique({
        where: { slug: slugToUse },
      });

      // If slug exists and belongs to a different workspace, generate a unique one
      if (slugConflict && slugConflict.sdkWorkspaceId !== sdkWorkspaceData.id) {
        console.warn(
          `Slug "${slugToUse}" already exists for workspace ${slugConflict.sdkWorkspaceId}, generating unique slug for workspace ${sdkWorkspaceData.id}`
        );
        // Generate a unique slug using sdkWorkspaceId as fallback
        slugToUse = `workspace-${sdkWorkspaceData.id}`;
      }
    } else {
      // If no slug provided, generate a unique one using sdkWorkspaceId
      // This prevents MongoDB unique constraint violations on null slugs
      slugToUse = `workspace-${sdkWorkspaceData.id}`;
    }

    if (existingWorkspace) {
      // Update existing workspace
      const workspace = await prisma.workspace.update({
        where: { sdkWorkspaceId: sdkWorkspaceData.id },
        data: {
          name: sdkWorkspaceData.name,
          image: sdkWorkspaceData.image || undefined,
          slug: slugToUse,
          description: sdkWorkspaceData.description || undefined,
          isActive: true, // Ensure workspace is active on sync
          updatedAt: new Date(),
        },
      });

      return { success: true, workspace };
    } else {
      // Create new workspace
      const workspace = await prisma.workspace.create({
        data: {
          sdkWorkspaceId: sdkWorkspaceData.id,
          name: sdkWorkspaceData.name,
          image: sdkWorkspaceData.image,
          slug: slugToUse, // Always set a slug to avoid null unique constraint issues
          description: sdkWorkspaceData.description,
          isActive: true,
        },
      });

      return { success: true, workspace };
    }
  } catch (error: unknown) {
    console.error("Error syncing workspace:", error);

    // If it's a unique constraint error on slug, try again without slug
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002" &&
      "meta" in error &&
      error.meta &&
      typeof error.meta === "object" &&
      "target" in error.meta &&
      Array.isArray(error.meta.target) &&
      error.meta.target.includes("slug")
    ) {
      try {
        const existingWorkspace = await prisma.workspace.findUnique({
          where: { sdkWorkspaceId: sdkWorkspaceData.id },
        });

        // Retry with generated unique slug
        const fallbackSlug = `workspace-${sdkWorkspaceData.id}`;

        if (existingWorkspace) {
          const workspace = await prisma.workspace.update({
            where: { sdkWorkspaceId: sdkWorkspaceData.id },
            data: {
              name: sdkWorkspaceData.name,
              image: sdkWorkspaceData.image || undefined,
              slug: fallbackSlug, // Use generated slug to avoid conflict
              description: sdkWorkspaceData.description || undefined,
              isActive: true,
              updatedAt: new Date(),
            },
          });
          return { success: true, workspace };
        } else {
          const workspace = await prisma.workspace.create({
            data: {
              sdkWorkspaceId: sdkWorkspaceData.id,
              name: sdkWorkspaceData.name,
              image: sdkWorkspaceData.image,
              slug: fallbackSlug, // Use generated slug to avoid conflict
              description: sdkWorkspaceData.description,
              isActive: true,
            },
          });
          return { success: true, workspace };
        }
      } catch (retryError) {
        console.error("Error retrying workspace sync without slug:", retryError);
        return { success: false, error: "Failed to sync workspace" };
      }
    }

    return { success: false, error: "Failed to sync workspace" };
  }
};
