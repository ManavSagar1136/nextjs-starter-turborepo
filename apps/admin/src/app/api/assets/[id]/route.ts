import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { AssetsRepository } from "@buildbase/database/assets";
import { getStorage } from "@buildbase/storage";
import { getAssetById, updateAsset, deleteAsset } from "@buildbase/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/assets/[id]
 * Get asset details
 * Requires: Admin role
 */
async function handleGET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Get asset using service
    const asset = await getAssetById(id);

    if (!asset) {
      return NextResponse.json({ success: false, message: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: asset.id,
        name: asset.filename,
        filename: asset.filename,
        url: asset.url,
        path: asset.path,
        size: asset.size,
        contentType: asset.contentType,
        isPublic: asset.isPublic,
        metadata: asset.metadata,
        folder: asset.folder,
        tags: asset.tags,
        createdAt: asset.createdAt.toISOString(),
        updatedAt: asset.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[API] Failed to get asset:", error);
    const message = error instanceof Error ? error.message : "Failed to get asset";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

/**
 * PATCH /api/assets/[id]
 * Update asset (folderId, tagIds)
 * Requires: Admin role
 */
async function handlePATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { folderId, tagIds } = body;

    // Update asset using service
    await updateAsset(id, {
      folderId,
      tagIds,
    });

    // Get updated asset with details
    const updatedAsset = await getAssetById(id);

    return NextResponse.json({
      success: true,
      message: "Asset updated successfully",
      data: updatedAsset
        ? {
            id: updatedAsset.id,
            name: updatedAsset.filename,
            filename: updatedAsset.filename,
            url: updatedAsset.url,
            path: updatedAsset.path,
            size: updatedAsset.size,
            contentType: updatedAsset.contentType,
            isPublic: updatedAsset.isPublic,
            metadata: updatedAsset.metadata,
            folder: updatedAsset.folder,
            tags: updatedAsset.tags,
            createdAt: updatedAsset.createdAt.toISOString(),
            updatedAt: updatedAsset.updatedAt.toISOString(),
          }
        : null,
    });
  } catch (error) {
    console.error("[API] Failed to update asset:", error);
    const message = error instanceof Error ? error.message : "Failed to update asset";
    const status =
      error instanceof Error && error.message.includes("not found")
        ? 404
        : error instanceof Error && (error.message.includes("must be") || error.message.includes("Maximum"))
          ? 400
          : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}

/**
 * DELETE /api/assets/[id]
 * Delete asset
 * Requires: Admin role
 */
async function handleDELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Get asset before deletion (for storage deletion)
    const asset = await AssetsRepository.findByIdAdmin(id);
    if (!asset) {
      return NextResponse.json({ success: false, message: "Asset not found" }, { status: 404 });
    }

    // Delete from storage
    let deletedFromStorage = false;
    try {
      const storage = await getStorage();
      await storage.delete(asset.path);
      deletedFromStorage = true;
    } catch (storageError) {
      console.error("[API] Error deleting from storage:", storageError);
      // Continue with database deletion even if storage fails
    }

    // Delete from database using service
    await deleteAsset(id);

    return NextResponse.json({
      success: true,
      message: "Asset deleted successfully",
      data: {
        deletedAssetId: id,
        deletedFromStorage,
      },
    });
  } catch (error) {
    console.error("[API] Failed to delete asset:", error);
    const message = error instanceof Error ? error.message : "Failed to delete asset";
    const status = error instanceof Error && error.message.includes("not found") ? 404 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}

// Export with auth middleware - Admin only
export const GET = withAuth(handleGET, [APP_ROLES.ADMIN]);
export const PATCH = withAuth(handlePATCH, [APP_ROLES.ADMIN]);
export const DELETE = withAuth(handleDELETE, [APP_ROLES.ADMIN]);
