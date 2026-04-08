import { prisma } from "../index";
import type { SDKWorkspaceData } from "./types";

/**
 * Sync or create workspace from SDK data
 */
export const syncWorkspace = async (sdkWorkspaceData: SDKWorkspaceData) => {
  try {
    // Validate required fields
    if (!sdkWorkspaceData) {
      return { success: false, error: "Workspace data is required" };
    }

    if (!sdkWorkspaceData.id) {
      return { success: false, error: "Workspace ID is required" };
    }

    if (!sdkWorkspaceData.name) {
      return { success: false, error: "Workspace name is required" };
    }

    console.log(`[syncWorkspace] Syncing workspace:`, {
      id: sdkWorkspaceData.id,
      name: sdkWorkspaceData.name,
      slug: sdkWorkspaceData.slug,
    });

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
          // Persist plan data when provided by subscription sync events
          ...(sdkWorkspaceData.features !== undefined && { features: sdkWorkspaceData.features }),
          ...(sdkWorkspaceData.limits !== undefined && { limits: sdkWorkspaceData.limits }),
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
          ...(sdkWorkspaceData.features !== undefined && { features: sdkWorkspaceData.features }),
          ...(sdkWorkspaceData.limits !== undefined && { limits: sdkWorkspaceData.limits }),
        },
      });

      return { success: true, workspace };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error syncing workspace:", error);

    // Check for Prisma-specific error codes
    const isPrismaError = error && typeof error === "object" && "code" in error;
    const prismaCode = isPrismaError ? (error as { code: string }).code : null;

    // If it's a unique constraint error on slug, try again without slug
    if (
      prismaCode === "P2002" &&
      error &&
      typeof error === "object" &&
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
        const retryErrorMessage = retryError instanceof Error ? retryError.message : String(retryError);
        console.error("Error retrying workspace sync without slug:", retryError);
        return { success: false, error: `Failed to sync workspace (retry): ${retryErrorMessage}` };
      }
    }

    // Handle other common Prisma errors
    if (prismaCode === "P2002") {
      return { success: false, error: `Workspace sync failed: duplicate key constraint violation` };
    }
    if (prismaCode === "P2025") {
      return { success: false, error: `Workspace sync failed: record not found` };
    }
    if (prismaCode === "P1001" || prismaCode === "P1002") {
      return { success: false, error: `Workspace sync failed: database connection error` };
    }

    return { success: false, error: `Failed to sync workspace: ${errorMessage}` };
  }
};
