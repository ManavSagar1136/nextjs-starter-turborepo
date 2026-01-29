import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@buildbase/helpers/auth";
import { prisma } from "@buildbase/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/folders/[id] - Get folder details
 */
export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
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

    const folder = await prisma.assetFolder.findFirst({
      where: { id, workspaceId },
      include: {
        _count: {
          select: {
            assets: true,
            children: true,
          },
        },
        parent: {
          select: { id: true, name: true },
        },
      },
    });

    if (!folder) {
      return NextResponse.json({ success: false, message: "Folder not found" }, { status: 404 });
    }

    // Build folder path
    const path: Array<{ id: string; name: string }> = [];
    let currentFolder = folder;
    while (currentFolder) {
      path.unshift({ id: currentFolder.id, name: currentFolder.name });
      if (currentFolder.parentFolderId) {
        const parent = await prisma.assetFolder.findFirst({
          where: { id: currentFolder.parentFolderId, workspaceId },
        });
        currentFolder = parent as typeof folder;
      } else {
        break;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: folder.id,
        name: folder.name,
        description: folder.description,
        parentFolderId: folder.parentFolderId,
        parent: folder.parent,
        path,
        _count: folder._count,
        createdAt: folder.createdAt.toISOString(),
        updatedAt: folder.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error getting folder:", error);
    return NextResponse.json({ success: false, message: "Failed to get folder" }, { status: 500 });
  }
}

/**
 * PATCH /api/folders/[id] - Update folder
 */
export async function PATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
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

    // Verify folder exists
    const existingFolder = await prisma.assetFolder.findFirst({
      where: { id, workspaceId },
    });
    if (!existingFolder) {
      return NextResponse.json({ success: false, message: "Folder not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, parentFolderId } = body;

    // Validate parent folder change
    if (parentFolderId !== undefined && parentFolderId !== existingFolder.parentFolderId) {
      // Can't move folder to itself
      if (parentFolderId === id) {
        return NextResponse.json({ success: false, message: "Cannot move folder into itself" }, { status: 400 });
      }

      // Verify new parent exists
      if (parentFolderId !== null) {
        const parentFolder = await prisma.assetFolder.findFirst({
          where: { id: parentFolderId, workspaceId },
        });
        if (!parentFolder) {
          return NextResponse.json({ success: false, message: "Parent folder not found" }, { status: 404 });
        }

        // Check for circular reference
        let checkFolder = parentFolder;
        while (checkFolder.parentFolderId) {
          if (checkFolder.parentFolderId === id) {
            return NextResponse.json(
              { success: false, message: "Cannot create circular folder reference" },
              { status: 400 }
            );
          }
          const nextFolder = await prisma.assetFolder.findFirst({
            where: { id: checkFolder.parentFolderId },
          });
          if (!nextFolder) break;
          checkFolder = nextFolder;
        }
      }
    }

    // Update folder
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description || null;
    if (parentFolderId !== undefined) updateData.parentFolderId = parentFolderId;

    const folder = await prisma.assetFolder.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: folder.id,
        name: folder.name,
        description: folder.description,
        parentFolderId: folder.parentFolderId,
        createdAt: folder.createdAt.toISOString(),
        updatedAt: folder.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error updating folder:", error);
    return NextResponse.json({ success: false, message: "Failed to update folder" }, { status: 500 });
  }
}

/**
 * DELETE /api/folders/[id] - Delete folder
 */
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
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
    const { searchParams } = new URL(request.url);
    const recursive = searchParams.get("recursive") === "true";

    // Verify folder exists
    const folder = await prisma.assetFolder.findFirst({
      where: { id, workspaceId },
      include: {
        _count: {
          select: { assets: true, children: true },
        },
      },
    });

    if (!folder) {
      return NextResponse.json({ success: false, message: "Folder not found" }, { status: 404 });
    }

    // Check for contents
    if (!recursive && (folder._count.assets > 0 || folder._count.children > 0)) {
      return NextResponse.json(
        {
          success: false,
          message: "Folder is not empty. Use recursive=true to delete with contents.",
          data: {
            assetCount: folder._count.assets,
            subfolderCount: folder._count.children,
          },
        },
        { status: 400 }
      );
    }

    // If recursive, move assets to root and delete subfolders
    if (recursive) {
      // Move all assets in this folder tree to root
      await prisma.asset.updateMany({
        where: {
          folderId: id,
          workspaceId,
        },
        data: { folderId: null },
      });

      // Recursively delete child folders
      const deleteChildFolders = async (parentId: string) => {
        const children = await prisma.assetFolder.findMany({
          where: { parentFolderId: parentId, workspaceId },
        });

        for (const child of children) {
          // Move child's assets to root
          await prisma.asset.updateMany({
            where: { folderId: child.id },
            data: { folderId: null },
          });
          // Recurse
          await deleteChildFolders(child.id);
          // Delete child folder
          await prisma.assetFolder.delete({ where: { id: child.id } });
        }
      };

      await deleteChildFolders(id);
    }

    // Delete the folder
    await prisma.assetFolder.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Folder deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting folder:", error);
    return NextResponse.json({ success: false, message: "Failed to delete folder" }, { status: 500 });
  }
}
