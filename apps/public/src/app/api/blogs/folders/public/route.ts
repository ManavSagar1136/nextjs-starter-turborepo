import { NextRequest, NextResponse } from "next/server";
import { prisma, listBlogFolders, getBlogFolderTree } from "@buildbase/database";

/**
 * GET /api/blogs/folders/public
 * Get all public blog folders
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tree = searchParams.get("tree") === "true";
    const search = searchParams.get("search") || undefined;
    const parentFolderId = searchParams.get("parentFolderId") || undefined;
    const $page = parseInt(searchParams.get("$page") || "1");
    const $limit = parseInt(searchParams.get("$limit") || "100");

    if (tree) {
      const treeData = await getBlogFolderTree(prisma);
      return NextResponse.json(treeData);
    }

    const result = await listBlogFolders(prisma, {
      search,
      parentFolderId: parentFolderId ?? undefined,
      page: $page,
      limit: $limit >= 10000 ? 10000 : $limit,
    });

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("[Blog Folders API] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch blog folders", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
