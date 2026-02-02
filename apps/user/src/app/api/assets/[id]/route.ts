import { NextRequest, NextResponse } from "next/server";
import { withPermissionCheck } from "@buildbase/helpers/auth";
import { WORKSPACE_ROLES } from "@buildbase/database/user";
import { AssetsRepository } from "@buildbase/database/assets";
import { getStorage } from "@buildbase/storage";
import { getAssetById, updateAsset, deleteAsset } from "@buildbase/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/assets/[id] - Get asset details
 */
async function handleGET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const authenticatedUser = (request as any).authenticatedUser as { workspaceId?: string } | undefined;
    if (!authenticatedUser?.workspaceId) {
      return NextResponse.json({ success: false, message: "No workspace selected" }, { status: 400 });
    }

    const { workspaceId } = authenticatedUser;

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
async function handlePATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const authenticatedUser = (request as any).authenticatedUser as { workspaceId?: string } | undefined;
    if (!authenticatedUser?.workspaceId) {
      return NextResponse.json({ success: false, message: "No workspace selected" }, { status: 400 });
    }

    const { workspaceId } = authenticatedUser;

    const { id } = await params;

    // Verify asset belongs to workspace
    const existingAsset = await AssetsRepository.findById(id, workspaceId);
    if (!existingAsset) {
      return NextResponse.json({ success: false, message: "Asset not found" }, { status: 404 });
    }

    const body = await request.json();
    const { folderId, tagIds, isPublic } = body;

    // If isPublic is being changed, update storage permissions first
    if (isPublic !== undefined) {
      // Get asset to check current state and get path
      const asset = await AssetsRepository.findById(id, workspaceId);
      if (!asset) {
        return NextResponse.json({ success: false, message: "Asset not found" }, { status: 404 });
      }

      // Update storage permissions
      const storage = await getStorage();
      let storageUpdateSuccess = true;
      try {
        if (isPublic) {
          await storage.makePublic(asset.path);
        } else {
          await storage.makePrivate(asset.path);
        }
      } catch (storageError) {
        console.error("Error updating storage permissions:", storageError);
        storageUpdateSuccess = false;
        // Don't continue if storage update fails - return error
        return NextResponse.json(
          {
            success: false,
            message: `Failed to update storage permissions: ${storageError instanceof Error ? storageError.message : "Unknown error"}`,
          },
          { status: 500 }
        );
      }

      // Update URL if privacy changed - ALWAYS update URL when privacy changes
      let url = asset.url;
      if (isPublic !== asset.isPublic && storageUpdateSuccess) {
        if (isPublic) {
          // For public assets, get permanent public URL
          const publicUrl = await storage.getPublicUrl(asset.path);
          if (publicUrl) {
            url = publicUrl;
          } else {
            // Fallback to public URL format
            url = `https://storage.googleapis.com/${storage.bucket}/${asset.path}`;
          }
        } else {
          // For private assets, generate signed URL immediately
          // This ensures the old public URL is replaced
          try {
            url = await storage.getSignedUrl(asset.path, { expiresInMinutes: 60 * 24 }); // 24 hours
          } catch (urlError) {
            console.error("Error generating signed URL:", urlError);
            // If signed URL generation fails, set to empty string
            // The asset will need a new signed URL generated on access
            url = "";
          }
        }

        // ALWAYS update the URL in database when privacy changes
        // This is critical to prevent using old public URLs
        await AssetsRepository.update(id, { url });
      }
    }

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
async function handleDELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const authenticatedUser = (request as any).authenticatedUser as { workspaceId?: string } | undefined;
    if (!authenticatedUser?.workspaceId) {
      return NextResponse.json({ success: false, message: "No workspace selected" }, { status: 400 });
    }

    const { workspaceId } = authenticatedUser;

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

// GET: Allow all workspace members to view assets
export const GET = withPermissionCheck(handleGET, [
  WORKSPACE_ROLES.ADMIN,
  WORKSPACE_ROLES.EDITOR,
  WORKSPACE_ROLES.VIEWER,
]);

// PATCH: Allow admins and editors to update assets
export const PATCH = withPermissionCheck(handlePATCH, [WORKSPACE_ROLES.ADMIN, WORKSPACE_ROLES.EDITOR]);

// DELETE: Allow admins and editors to delete assets
export const DELETE = withPermissionCheck(handleDELETE, [WORKSPACE_ROLES.ADMIN, WORKSPACE_ROLES.EDITOR]);
