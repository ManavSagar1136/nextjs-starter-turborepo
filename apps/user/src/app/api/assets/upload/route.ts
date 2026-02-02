import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { getStorage } from "@buildbase/storage";
import { AssetsRepository } from "@buildbase/database/assets";
import { randomUUID } from "crypto";

/**
 * POST /api/assets/upload - Get signed URL for upload
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
    const { filename, contentType, size } = body;

    if (!filename || !contentType || !size) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: filename, contentType, size" },
        { status: 400 }
      );
    }

    // Generate unique path
    const ext = filename.split(".").pop() || "";
    const uniqueId = randomUUID();
    const path = `${workspaceId}/${uniqueId}${ext ? `.${ext}` : ""}`;

    // Get signed URL from storage provider
    const storage = await getStorage();
    const signedUrl = await storage.getSignedUrl(path, {
      action: "write",
      contentType,
      expiresInMinutes: 60, // 1 hour
    });

    return NextResponse.json({
      success: true,
      data: {
        url: signedUrl,
        path,
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error("Error getting signed upload URL:", error);
    return NextResponse.json({ success: false, message: "Failed to get upload URL" }, { status: 500 });
  }
}

export const POST = withAuth(handlePOST, [APP_ROLES.USER]);
