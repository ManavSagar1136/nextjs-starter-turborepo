import { NextRequest, NextResponse } from "next/server";
import { withPermissionCheck, withPlanCheck, PLAN_FEATURES } from "@buildbase/helpers/auth";
import { WORKSPACE_ROLES } from "@buildbase/database/user";
import { getStorage } from "@buildbase/storage";
import { AssetsRepository } from "@buildbase/database/assets";

/**
 * POST /api/assets/upload/complete - Complete upload and create asset record
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const authenticatedUser = (request as any).authenticatedUser as
      | { workspaceId?: string; userId?: string }
      | undefined;
    if (!authenticatedUser?.workspaceId) {
      return NextResponse.json({ success: false, message: "No workspace selected" }, { status: 400 });
    }
    if (!authenticatedUser?.userId) {
      return NextResponse.json({ success: false, message: "User ID not found" }, { status: 400 });
    }

    const { workspaceId, userId } = authenticatedUser;
    if (!workspaceId) {
      return NextResponse.json({ success: false, message: "No workspace selected" }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID not found" }, { status: 400 });
    }

    const body = await request.json();
    const { path, makePublic = false, filename, contentType, size, folderId } = body;

    if (!path) {
      return NextResponse.json({ success: false, message: "Missing required field: path" }, { status: 400 });
    }

    const storage = await getStorage();

    // Get file metadata from storage if not provided
    let finalFilename = filename;
    let finalContentType = contentType;
    let finalSize = size;

    if (!finalFilename || !finalContentType || !finalSize) {
      try {
        const metadata = await storage.getMetadata(path);
        finalFilename = finalFilename || path.split("/").pop() || "unknown";
        finalContentType = finalContentType || metadata.contentType || "application/octet-stream";
        finalSize = finalSize || metadata.size || 0;
      } catch {
        // Use defaults if metadata fetch fails
        finalFilename = finalFilename || path.split("/").pop() || "unknown";
        finalContentType = finalContentType || "application/octet-stream";
        finalSize = finalSize || 0;
      }
    }

    // Get or generate public URL
    let url = "";
    if (makePublic) {
      try {
        await storage.makePublic(path);
        const publicUrl = await storage.getPublicUrl(path);
        url = publicUrl || (await storage.getSignedUrl(path, { expiresInMinutes: 60 * 24 * 7 })); // 7 days
      } catch {
        // Generate URL manually if makePublic fails
        url = await storage.getSignedUrl(path, { expiresInMinutes: 60 * 24 * 7 }); // 7 days
      }
    } else {
      // For private assets, generate a signed URL
      url = await storage.getSignedUrl(path, { expiresInMinutes: 60 * 24 }); // 24 hours
    }

    // Create asset record
    const asset = await AssetsRepository.create({
      filename: finalFilename,
      path,
      url,
      size: finalSize,
      contentType: finalContentType,
      bucket: storage.bucket || "default",
      isPublic: makePublic,
      workspaceId,
      userId,
      folderId: folderId || undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: asset.id,
        url: asset.url,
        path: asset.path,
        filename: asset.filename,
        contentType: asset.contentType,
        size: asset.size,
        isPublic: asset.isPublic,
      },
    });
  } catch (error) {
    console.error("Error completing upload:", error);
    return NextResponse.json({ success: false, message: "Failed to complete upload" }, { status: 500 });
  }
}

/**
 * POST /api/assets/upload/complete
 *
 * Storage quota was already PRE-CHARGED at /api/assets/upload (signed URL step).
 * No quota recording here — only the feature gate check remains.
 *
 * The pre-charge at /upload is automatically reverted by withQuotaCheck if
 * this endpoint returns a non-2xx response.
 */
export const POST = withPermissionCheck(withPlanCheck(handlePOST, { feature: PLAN_FEATURES.MEDIA_LIBRARY }), [
  WORKSPACE_ROLES.ADMIN,
  WORKSPACE_ROLES.EDITOR,
]);
