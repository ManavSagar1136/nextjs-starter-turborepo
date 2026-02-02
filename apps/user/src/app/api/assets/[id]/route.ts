import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@buildbase/helpers/auth";
import { AssetsRepository } from "@buildbase/database/assets";
import { getStorage } from "@buildbase/storage";
import { getAssetById, updateAsset, deleteAsset } from "@buildbase/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/assets/[id] - Get asset details
 */
export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = session.user;
    if (!workspaceId) {
      return NextResponse.json({ success: false, message: "No workspace selected" }, { status: 400 });
    }

    const { id } = await params;

    // Verify asset belongs to workspace
    const assetRecord = await AssetsRepository.findById(id, workspaceId);
    if (!assetRecord) {
      return NextResponse.json({ success: false, message: "Asset not found" }, { status: 404 });
    }

    // Get asset with details
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
    console.error("Error getting asset:", error);
    return NextResponse.json({ success: false, message: "Failed to get asset" }, { status: 500 });
  }
}

/**
 * PATCH /api/assets/[id] - Update asset
 */
export async function PATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = session.user;
    if (!workspaceId) {
      return NextResponse.json({ success: false, message: "No workspace selected" }, { status: 400 });
    }

    const { id } = await params;

    // Verify asset belongs to workspace
    const existingAsset = await AssetsRepository.findById(id, workspaceId);
    if (!existingAsset) {
      return NextResponse.json({ success: false, message: "Asset not found" }, { status: 404 });
    }

    const body = await request.json();
    const { folderId, tagIds, isPublic } = body;

    // Update asset using service
    await updateAsset(id, {
      folderId,
      tagIds,
      isPublic,
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
    console.error("Error updating asset:", error);
    return NextResponse.json({ success: false, message: "Failed to update asset" }, { status: 500 });
  }
}

/**
 * DELETE /api/assets/[id] - Delete asset
 */
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = session.user;
    if (!workspaceId) {
      return NextResponse.json({ success: false, message: "No workspace selected" }, { status: 400 });
    }

    const { id } = await params;

    // Verify asset belongs to workspace
    const asset = await AssetsRepository.findById(id, workspaceId);
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
      console.error("Error deleting from storage:", storageError);
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
    console.error("Error deleting asset:", error);
    return NextResponse.json({ success: false, message: "Failed to delete asset" }, { status: 500 });
  }
}
