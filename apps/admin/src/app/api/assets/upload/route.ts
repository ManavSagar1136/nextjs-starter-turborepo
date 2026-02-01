import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { getStorage } from "@buildbase/storage";
import { randomUUID } from "crypto";

/**
 * POST /api/assets/upload - Get signed URL for upload (Admin)
 * Admin can upload assets without workspace context
 */
async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename, contentType, size } = body;

    if (!filename || !contentType || !size) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: filename, contentType, size" },
        { status: 400 }
      );
    }

    // Get authenticated user from request (set by withAuth middleware)
    const authenticatedUser = (request as any).authenticatedUser as {
      userId?: string;
      workspaceId?: string;
      role?: string;
    };

    if (!authenticatedUser?.userId) {
      return NextResponse.json(
        { success: false, message: "User ID not found in authentication token" },
        { status: 401 }
      );
    }

    // Generate unique path
    // For admin: use "admin" prefix (no workspace association)
    // For users: use workspaceId from session
    const ext = filename.split(".").pop() || "";
    const uniqueId = randomUUID();
    const isAdmin = authenticatedUser.role === "admin";
    const pathPrefix = isAdmin ? "admin" : authenticatedUser.workspaceId || "admin";
    const path = `${pathPrefix}/${uniqueId}${ext ? `.${ext}` : ""}`;

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
    console.error("[API] Error getting signed upload URL:", error);
    return NextResponse.json({ success: false, message: "Failed to get upload URL" }, { status: 500 });
  }
}

// Export with auth middleware - Admin only
export const POST = withAuth(handlePOST, [APP_ROLES.ADMIN]);
