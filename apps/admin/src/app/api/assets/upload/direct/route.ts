import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { getStorage } from "@buildbase/storage";
import { AssetsRepository } from "@buildbase/database/assets";
import { prisma } from "@buildbase/database";
import { randomUUID } from "crypto";

/**
 * POST /api/assets/upload/direct
 *
 * Single-step upload that accepts multipart/form-data and writes the file
 * directly through the server-side storage provider.
 *
 * Works with all storage backends (local, GCS, S3) — no client-side signed-URL PUT needed.
 *
 * Fields:
 *   file       File      (required)
 *   makePublic "true"|"false"  (default: "true")
 *   folderId   string    (optional)
 */
async function handlePOST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: "Missing required field: file" }, { status: 400 });
    }

    const makePublic = formData.get("makePublic") !== "false"; // default true
    const folderId = (formData.get("folderId") as string | null) || undefined;

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

    // Build storage path
    const ext = file.name.split(".").pop() || "";
    const uniqueId = randomUUID();
    const isAdmin = authenticatedUser.role === "admin";
    const pathPrefix = isAdmin ? "admin" : authenticatedUser.workspaceId || "admin";
    const path = `${pathPrefix}/${uniqueId}${ext ? `.${ext}` : ""}`;

    // Upload directly through server-side storage (works for all providers)
    const storage = await getStorage();
    const buffer = Buffer.from(await file.arrayBuffer());

    await storage.upload(buffer, {
      path,
      contentType: file.type || "application/octet-stream",
      makePublic,
    });

    // Make public and get URL
    let url = "";
    if (makePublic) {
      try {
        await storage.makePublic(path);
        const publicUrl = await storage.getPublicUrl(path);
        url = publicUrl || (await storage.getSignedUrl(path, { expiresInMinutes: 60 * 24 * 7 }));
      } catch {
        url = await storage.getSignedUrl(path, { expiresInMinutes: 60 * 24 * 7 });
      }
    } else {
      url = await storage.getSignedUrl(path, { expiresInMinutes: 60 * 24 });
    }

    // Resolve workspace ID (same logic as /upload/complete)
    let finalWorkspaceId = authenticatedUser.workspaceId;

    if (isAdmin && !finalWorkspaceId) {
      let adminWorkspace = await prisma.workspace.findFirst({
        where: { OR: [{ slug: "admin" }, { name: { contains: "Admin", mode: "insensitive" } }] },
      });
      if (!adminWorkspace) {
        adminWorkspace = await prisma.workspace.create({
          data: {
            name: "Admin Workspace",
            slug: "admin",
            sdkWorkspaceId: `admin-${randomUUID()}`,
            isActive: true,
          },
        });
      }
      finalWorkspaceId = adminWorkspace.id;
    } else if (!isAdmin && !finalWorkspaceId) {
      return NextResponse.json({ success: false, message: "Workspace ID is required" }, { status: 400 });
    }

    // Register asset in database
    const asset = await AssetsRepository.create({
      filename: file.name,
      path,
      url,
      size: file.size,
      contentType: file.type || "application/octet-stream",
      bucket: storage.bucket || "default",
      isPublic: makePublic,
      workspaceId: finalWorkspaceId!,
      userId: authenticatedUser.userId!,
      folderId,
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
    console.error("[API] Error in direct upload:", error);
    return NextResponse.json({ success: false, message: "Upload failed" }, { status: 500 });
  }
}

export const POST = withAuth(handlePOST, [APP_ROLES.ADMIN]);
