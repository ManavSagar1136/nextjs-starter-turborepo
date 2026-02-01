import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@buildbase/helpers/auth";
import { getStorage } from "@buildbase/storage";
import { bulkDeleteAssets, bulkMoveAssets, bulkAssignTags, bulkRemoveTags } from "@buildbase/database";
import { AssetsRepository } from "@buildbase/database/assets";

/**
 * POST /api/assets/bulk/delete - Bulk delete assets
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = session.user;
    if (!workspaceId) {
      return NextResponse.json({ success: false, message: "No workspace selected" }, { status: 400 });
    }

    const body = await request.json();
    const { action, assetIds, folderId, tagIds } = body;

    if (!action || !Array.isArray(assetIds) || assetIds.length === 0) {
      return NextResponse.json({ success: false, message: "action and assetIds array are required" }, { status: 400 });
    }

    let result;

    switch (action) {
      case "delete": {
        // Get assets before deletion for storage cleanup
        const assets = await Promise.all(assetIds.map(id => AssetsRepository.findById(id, workspaceId)));

        // Delete from storage (best effort)
        const storage = await getStorage();
        for (const asset of assets) {
          if (asset?.path) {
            try {
              await storage.delete(asset.path);
            } catch (storageError) {
              console.error("Error deleting from storage:", storageError);
              // Continue with database deletion even if storage fails
            }
          }
        }

        // Delete from database
        result = await bulkDeleteAssets(assetIds, workspaceId);
        break;
      }

      case "move": {
        if (folderId === undefined) {
          return NextResponse.json(
            { success: false, message: "folderId is required for move action" },
            { status: 400 }
          );
        }

        result = await bulkMoveAssets(assetIds, folderId === null ? null : folderId, workspaceId);
        break;
      }

      case "assignTags": {
        if (!Array.isArray(tagIds) || tagIds.length === 0) {
          return NextResponse.json(
            { success: false, message: "tagIds array is required for assignTags action" },
            { status: 400 }
          );
        }

        result = await bulkAssignTags(assetIds, tagIds, workspaceId);
        break;
      }

      case "removeTags": {
        if (!Array.isArray(tagIds) || tagIds.length === 0) {
          return NextResponse.json(
            { success: false, message: "tagIds array is required for removeTags action" },
            { status: 400 }
          );
        }

        result = await bulkRemoveTags(assetIds, tagIds, workspaceId);
        break;
      }

      default:
        return NextResponse.json({ success: false, message: `Invalid action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        successCount: result.successCount,
        failureCount: result.failureCount,
        errors: result.errors.length > 0 ? result.errors : undefined,
      },
    });
  } catch (error) {
    console.error("Error in bulk operation:", error);
    const message = error instanceof Error ? error.message : "Failed to perform bulk operation";
    const status =
      error instanceof Error &&
      (error.message.includes("Maximum") || error.message.includes("required") || error.message.includes("Invalid"))
        ? 400
        : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
