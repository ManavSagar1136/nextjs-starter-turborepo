import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@buildbase/helpers/auth";
import { getAssetById, updateAsset } from "@buildbase/database";
import { AssetsRepository } from "@buildbase/database/assets";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/assets/[id]/move - Move asset to a different folder
 */
export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
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
    const body = await request.json();
    const { folderId } = body;

    if (folderId === undefined) {
      return NextResponse.json({ success: false, message: "folderId is required (can be null)" }, { status: 400 });
    }

    // Verify asset belongs to workspace
    const existingAsset = await AssetsRepository.findById(id, workspaceId);
    if (!existingAsset) {
      return NextResponse.json({ success: false, message: "Asset not found" }, { status: 404 });
    }

    // Move asset using service
    await updateAsset(id, {
      folderId: folderId === null ? null : folderId,
    });

    // Get updated asset
    const updatedAsset = await getAssetById(id);

    return NextResponse.json({
      success: true,
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
    console.error("Error moving asset:", error);
    const message = error instanceof Error ? error.message : "Failed to move asset";
    const status =
      error instanceof Error && error.message.includes("not found")
        ? 404
        : error instanceof Error && (error.message.includes("must be") || error.message.includes("Maximum"))
          ? 400
          : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
