import { NextRequest, NextResponse } from "next/server";
import { withPermissionCheck, withPlanCheck, withQuotaCheck, PLAN_FEATURES, PLAN_QUOTAS } from "@buildbase/helpers/auth";
import { WORKSPACE_ROLES } from "@buildbase/database/user";
import { getStorage } from "@buildbase/storage";
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
        // Echo back the size so /upload/complete can revert if needed
        size,
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error("Error getting signed upload URL:", error);
    return NextResponse.json({ success: false, message: "Failed to get upload URL" }, { status: 500 });
  }
}

/**
 * POST /api/assets/upload
 *
 * Quota is PRE-CHARGED here (recordTiming: 'pre') — capacity is reserved when the
 * signed URL is issued, before the client uploads the file to cloud storage.
 *
 * Revert behaviour:
 *   - If THIS handler fails (e.g. storage provider error) → withQuotaCheck auto-reverts
 *     the pre-charge with a negative record (fire-and-forget).
 *   - If this handler succeeds but /upload/complete later fails → quota stays charged.
 *     The file already exists in storage at that point, so the charge is correct.
 *   - If the client never calls /upload/complete (abandoned / browser crash) → quota
 *     leaks until the next billing period reset. Acceptable: URL expires in 1 hour and
 *     the binary may still occupy storage.
 *
 * quantity: file size converted from bytes → KB (minimum 1 unit).
 */
export const POST = withPermissionCheck(
  withPlanCheck(
    withQuotaCheck(handlePOST, {
      quotaSlug: PLAN_QUOTAS.MEDIA_STORAGE,
      quantity: async req => {
        try {
          const body = await req.clone().json();
          const sizeBytes: number = body.size ?? 0;
          return Math.max(1, Math.ceil(sizeBytes / 1024)); // bytes → KB, min 1
        } catch {
          return 1; // fallback if body can't be parsed
        }
      },
      source: "upload",
      allowOverage: true,
      recordTiming: "pre", // pre-charge: reserve quota before upload starts
    }),
    { feature: PLAN_FEATURES.MEDIA_LIBRARY }
  ),
  [WORKSPACE_ROLES.ADMIN, WORKSPACE_ROLES.EDITOR]
);
