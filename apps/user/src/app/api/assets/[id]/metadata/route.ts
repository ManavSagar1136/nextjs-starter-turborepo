import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@buildbase/helpers/auth";
import { updateAsset, getAssetById } from "@buildbase/database";
import { AssetsRepository } from "@buildbase/database/assets";

/**
 * PATCH /api/assets/[id]/metadata - Update asset metadata
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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
    const { filename, metadata } = body;

    // Validate filename if provided
    if (filename !== undefined) {
      if (typeof filename !== "string" || filename.trim().length === 0) {
        return NextResponse.json({ success: false, message: "Filename must be a non-empty string" }, { status: 400 });
      }
    }

    // Validate metadata if provided
    if (metadata !== undefined && metadata !== null && typeof metadata !== "object") {
      return NextResponse.json({ success: false, message: "Metadata must be an object or null" }, { status: 400 });
    }

    // Update asset metadata using service
    await updateAsset(id, {
      filename: filename !== undefined ? filename.trim() : undefined,
      metadata: metadata !== undefined ? metadata : undefined,
    });

    // Get updated asset with details
    const updatedAsset = await getAssetById(id);

    return NextResponse.json({
      success: true,
      message: "Asset metadata updated successfully",
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
    console.error("Error updating asset metadata:", error);
    const message = error instanceof Error ? error.message : "Failed to update asset metadata";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
