import { NextRequest, NextResponse } from "next/server";
import { DUMMY_BLOG_FOLDERS } from "@/data/dummy/blogs";

/**
 * GET /api/blogs/folders/public
 * Get all public blog folders
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tree = searchParams.get("tree") === "true";
    const search = searchParams.get("search");
    const parentFolderId = searchParams.get("parentFolderId");
    const $page = parseInt(searchParams.get("$page") || "1");
    const $limit = parseInt(searchParams.get("$limit") || "100");

    let filteredFolders = [...DUMMY_BLOG_FOLDERS];

    // Filter by parent folder
    if (parentFolderId) {
      filteredFolders = filteredFolders.filter(
        (folder) => folder.parentFolderId === parentFolderId,
      );
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredFolders = filteredFolders.filter(
        (folder) =>
          folder.name.toLowerCase().includes(searchLower) ||
          folder.slug.toLowerCase().includes(searchLower) ||
          folder.path?.toLowerCase().includes(searchLower),
      );
    }

    // Build tree structure if requested
    if (tree) {
      const folderMap = new Map(filteredFolders.map((f) => [f.id, f]));
      const rootFolders: typeof DUMMY_BLOG_FOLDERS = [];

      filteredFolders.forEach((folder) => {
        if (!folder.parentFolderId) {
          rootFolders.push(folder);
        } else {
          const parent = folderMap.get(folder.parentFolderId);
          if (parent) {
            if (!parent.subFolders) {
              parent.subFolders = [];
            }
            parent.subFolders.push(folder);
          }
        }
      });

      return NextResponse.json(rootFolders);
    }

    // Apply pagination
    const total = filteredFolders.length;
    const offset = ($page - 1) * $limit;
    const paginatedFolders = filteredFolders.slice(offset, offset + $limit);

    return NextResponse.json(paginatedFolders);
  } catch (error) {
    console.error("[Blog Folders API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch blog folders",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
