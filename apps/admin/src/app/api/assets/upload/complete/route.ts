import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { getStorage } from "@buildbase/storage";
import { AssetsRepository } from "@buildbase/database/assets";
import { prisma } from "@buildbase/database";
import { randomUUID } from "crypto";

/**
 * POST /api/assets/upload/complete - Complete upload and create asset record (Admin)
 * Admin can upload assets without workspace context (uses admin workspace or specified workspace)
 */
async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, makePublic = false, filename, contentType, size, folderId } = body;

    if (!path) {
      return NextResponse.json({ success: false, message: "Missing required field: path" }, { status: 400 });
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

    // Extract user ID and workspace ID from authenticated session
    const finalUserId = authenticatedUser.userId;
    let finalWorkspaceId = authenticatedUser.workspaceId;

    // For admin users: no workspace (or use admin workspace if needed)
    // For regular users: use workspace from session
    const isAdmin = authenticatedUser.role === "admin";

    if (isAdmin) {
      // Admin uploads: no workspace association, or use admin workspace if needed
      // Extract workspaceId from path if present (format: "workspaceId/uuid.ext" or "admin/uuid.ext")
      if (!finalWorkspaceId && path.includes("/")) {
        const pathParts = path.split("/");
        if (pathParts[0] && pathParts[0] !== "admin") {
          // Try to find workspace by ID
          const workspace = await prisma.workspace.findUnique({
            where: { id: pathParts[0] },
          });
          if (workspace) {
            finalWorkspaceId = workspace.id;
          }
        }
      }

      // If no workspace provided for admin, find or create a default admin workspace
      if (!finalWorkspaceId) {
        let adminWorkspace = await prisma.workspace.findFirst({
          where: {
            OR: [{ slug: "admin" }, { name: { contains: "Admin", mode: "insensitive" } }],
          },
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
      }
    } else {
      // Regular user uploads: workspace ID is required from session
      if (!finalWorkspaceId) {
        return NextResponse.json(
          { success: false, message: "Workspace ID is required for user uploads" },
          { status: 400 }
        );
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
      workspaceId: finalWorkspaceId,
      userId: finalUserId,
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
    console.error("[API] Error completing upload:", error);
    return NextResponse.json({ success: false, message: "Failed to complete upload" }, { status: 500 });
  }
}

// Export with auth middleware - Admin only
export const POST = withAuth(handlePOST, [APP_ROLES.ADMIN]);
