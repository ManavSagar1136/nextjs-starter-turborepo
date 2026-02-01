import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { duplicateAsset, getAssetById } from "@buildbase/database";
import { AssetsRepository } from "@buildbase/database/assets";

/**
 * POST /api/assets/[id]/duplicate - Duplicate an asset (Admin)
 */
async function handlePOST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Verify asset exists (admin can access any asset)
    const existingAsset = await AssetsRepository.findByIdAdmin(id);
    if (!existingAsset) {
      return NextResponse.json({ success: false, message: "Asset not found" }, { status: 404 });
    }

    // Duplicate the asset (workspaceId: null for admin)
    const newAssetId = await duplicateAsset(id, null);

    // Get the duplicated asset with details
    const duplicatedAsset = await getAssetById(newAssetId);

    return NextResponse.json({
      success: true,
      message: "Asset duplicated successfully",
      data: duplicatedAsset
        ? {
            id: duplicatedAsset.id,
            name: duplicatedAsset.filename,
            filename: duplicatedAsset.filename,
            url: duplicatedAsset.url,
            path: duplicatedAsset.path,
            size: duplicatedAsset.size,
            contentType: duplicatedAsset.contentType,
            isPublic: duplicatedAsset.isPublic,
            metadata: duplicatedAsset.metadata,
            folder: duplicatedAsset.folder,
            tags: duplicatedAsset.tags,
            createdAt: duplicatedAsset.createdAt.toISOString(),
            updatedAt: duplicatedAsset.updatedAt.toISOString(),
          }
        : null,
    });
  } catch (error) {
    console.error("[API] Error duplicating asset:", error);
    const message = error instanceof Error ? error.message : "Failed to duplicate asset";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export const POST = withAuth(handlePOST, [APP_ROLES.ADMIN]);
