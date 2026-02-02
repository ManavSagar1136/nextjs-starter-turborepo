import { NextRequest, NextResponse } from "next/server";
import { withPermissionCheck } from "@buildbase/helpers/auth";
import { WORKSPACE_ROLES } from "@buildbase/database/user";
import { getAssetById, updateAsset } from "@buildbase/database";
import { AssetsRepository } from "@buildbase/database/assets";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/assets/[id]/tags - Assign tags to asset
 */
async function handlePOST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const authenticatedUser = (request as any).authenticatedUser as { workspaceId?: string } | undefined;
    if (!authenticatedUser?.workspaceId) {
      return NextResponse.json({ success: false, message: "No workspace selected" }, { status: 400 });
    }

    const { workspaceId } = authenticatedUser;

    const { id } = await params;
    const body = await request.json();
    const { tagIds } = body;

    if (!Array.isArray(tagIds)) {
      return NextResponse.json({ success: false, message: "tagIds must be an array" }, { status: 400 });
    }

    // Verify asset belongs to workspace
    const existingAsset = await AssetsRepository.findById(id, workspaceId);
    if (!existingAsset) {
      return NextResponse.json({ success: false, message: "Asset not found" }, { status: 404 });
    }

    // Assign tags using service (replace all existing tags)
    await updateAsset(
      id,
      {
        tagIds,
      },
      workspaceId
    );

    // Get updated asset with tags
    const updatedAsset = await getAssetById(id, workspaceId);

    return NextResponse.json({
      success: true,
      data: {
        tags: updatedAsset?.tags || [],
      },
    });
  } catch (error) {
    console.error("Error assigning tags to asset:", error);
    const message = error instanceof Error ? error.message : "Failed to assign tags";
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
 * DELETE /api/assets/[id]/tags - Remove tags from asset
 */
async function handleDELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const authenticatedUser = (request as any).authenticatedUser as { workspaceId?: string } | undefined;
    if (!authenticatedUser?.workspaceId) {
      return NextResponse.json({ success: false, message: "No workspace selected" }, { status: 400 });
    }

    const { workspaceId } = authenticatedUser;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const tagIdsParam = searchParams.get("tagIds");

    // Parse tagIds from query or body
    let tagIds: string[] = [];
    if (tagIdsParam) {
      tagIds = tagIdsParam.split(",").filter(Boolean);
    } else {
      const body = await request.json().catch(() => ({}));
      if (Array.isArray(body.tagIds)) {
        tagIds = body.tagIds;
      }
    }

    if (tagIds.length === 0) {
      return NextResponse.json({ success: false, message: "tagIds is required" }, { status: 400 });
    }

    // Verify asset belongs to workspace
    const existingAssetRecord = await AssetsRepository.findById(id, workspaceId);
    if (!existingAssetRecord) {
      return NextResponse.json({ success: false, message: "Asset not found" }, { status: 404 });
    }

    // Get current asset with tags
    const existingAsset = await getAssetById(id, workspaceId);
    if (!existingAsset) {
      return NextResponse.json({ success: false, message: "Asset not found" }, { status: 404 });
    }

    // Get current tags and remove specified ones
    const currentTagIds = (existingAsset.tags || []).map(tag => tag.id);
    const remainingTagIds = currentTagIds.filter(tagId => !tagIds.includes(tagId));

    // Update asset with remaining tags
    await updateAsset(
      id,
      {
        tagIds: remainingTagIds,
      },
      workspaceId
    );

    return NextResponse.json({
      success: true,
      message: "Tags removed successfully",
    });
  } catch (error) {
    console.error("Error removing tags from asset:", error);
    const message = error instanceof Error ? error.message : "Failed to remove tags";
    const status =
      error instanceof Error && error.message.includes("not found")
        ? 404
        : error instanceof Error && (error.message.includes("must be") || error.message.includes("Maximum"))
          ? 400
          : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}

// POST/DELETE: Allow admins and editors to manage asset tags
export const POST = withPermissionCheck(handlePOST, [WORKSPACE_ROLES.ADMIN, WORKSPACE_ROLES.EDITOR]);
export const DELETE = withPermissionCheck(handleDELETE, [WORKSPACE_ROLES.ADMIN, WORKSPACE_ROLES.EDITOR]);
