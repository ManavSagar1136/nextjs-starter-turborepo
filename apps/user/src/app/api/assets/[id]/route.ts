import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@buildbase/helpers/auth";
import { prisma } from "@buildbase/database";
import { AssetsRepository } from "@buildbase/database/assets";
import { getStorage } from "@buildbase/storage";

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
    const asset = await AssetsRepository.findWithDetails(id, workspaceId);

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
    const { filename, folderId, tags, metadata } = body;

    // Update asset
    const updateData: Parameters<typeof AssetsRepository.update>[1] = {};
    if (filename !== undefined) updateData.filename = filename;
    if (folderId !== undefined) updateData.folderId = folderId;
    if (metadata !== undefined) updateData.metadata = metadata;

    const asset = await AssetsRepository.update(id, updateData);

    // Update tags if provided
    if (tags !== undefined && Array.isArray(tags)) {
      await AssetsRepository.setTags(id, tags);
    }

    // Get updated asset with details
    const updatedAsset = await AssetsRepository.findWithDetails(id, workspaceId);

    return NextResponse.json({
      success: true,
      data: updatedAsset,
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

    // Delete from database
    await AssetsRepository.delete(id);

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
