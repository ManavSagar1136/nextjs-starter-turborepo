import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@buildbase/helpers/auth";
import { prisma } from "@buildbase/database";

interface FolderTreeItem {
  id: string;
  name: string;
  children: FolderTreeItem[];
  _count?: {
    assets: number;
    children: number;
  };
}

/**
 * GET /api/folders/tree - Get folder tree structure
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = session.user;
    if (!workspaceId) {
      return NextResponse.json({ success: false, message: "No workspace selected" }, { status: 400 });
    }

    // Get all folders for the workspace
    const folders = await prisma.assetFolder.findMany({
      where: { workspaceId },
      include: {
        _count: {
          select: {
            assets: true,
            children: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Build tree structure
    const folderMap = new Map<string, FolderTreeItem>();
    const rootFolders: FolderTreeItem[] = [];

    // First pass: create all folder items
    for (const folder of folders) {
      folderMap.set(folder.id, {
        id: folder.id,
        name: folder.name,
        children: [],
        _count: folder._count,
      });
    }

    // Second pass: build hierarchy
    for (const folder of folders) {
      const item = folderMap.get(folder.id)!;
      if (folder.parentFolderId) {
        const parent = folderMap.get(folder.parentFolderId);
        if (parent) {
          parent.children.push(item);
        } else {
          // Parent not found, treat as root
          rootFolders.push(item);
        }
      } else {
        rootFolders.push(item);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        tree: rootFolders,
      },
    });
  } catch (error) {
    console.error("Error getting folder tree:", error);
    return NextResponse.json({ success: false, message: "Failed to get folder tree" }, { status: 500 });
  }
}
