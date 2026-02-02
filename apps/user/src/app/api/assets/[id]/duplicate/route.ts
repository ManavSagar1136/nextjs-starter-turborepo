import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { getAssetById } from "@buildbase/database";
import { duplicateAsset } from "@buildbase/database/asset/server";
import { AssetsRepository } from "@buildbase/database/assets";

/**
 * POST /api/assets/[id]/duplicate - Duplicate an asset
 */
async function handlePOST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const authenticatedUser = (request as any).authenticatedUser as { workspaceId?: string } | undefined;
    if (!authenticatedUser?.workspaceId) {
      return NextResponse.json({ success: false, message: "No workspace selected" }, { status: 400 });
    }

    const { workspaceId } = authenticatedUser;
    if (!workspaceId) {
      return NextResponse.json({ success: false, message: "No workspace selected" }, { status: 400 });
    }

    const { id } = await params;

    // Verify asset belongs to workspace
    const existingAsset = await AssetsRepository.findById(id, workspaceId);
    if (!existingAsset) {
      return NextResponse.json({ success: false, message: "Asset not found" }, { status: 404 });
    }

    // Duplicate the asset
    const newAssetId = await duplicateAsset(id, workspaceId);

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
    console.error("Error duplicating asset:", error);
    const message = error instanceof Error ? error.message : "Failed to duplicate asset";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export const POST = withAuth(handlePOST, [APP_ROLES.USER]);
