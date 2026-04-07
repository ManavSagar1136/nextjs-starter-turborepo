import { NextRequest, NextResponse } from "next/server";
import { prisma, listDocPosts } from "@buildbase/database";

/**
 * GET /api/docs
 * Get all published documents with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const $page = parseInt(searchParams.get("$page") || "1");
    const $limit = parseInt(searchParams.get("$limit") || "20");
    const folderId = searchParams.get("folderId") || undefined;
    const search = searchParams.get("search") || undefined;

    const result = await listDocPosts(prisma, {
      published: true,
      folderId,
      search,
      page: $page,
      limit: $limit >= 10000 ? 10000 : $limit,
    });

    const { computeDocUrl } = await import("@/lib/docs/doc-url.service");
    const docsWithUrl = result.data.map((doc: any) => ({
      ...doc,
      url: computeDocUrl(doc),
    }));

    const totalPages = result.totalPages;
    const offset = ($page - 1) * $limit;

    return NextResponse.json({
      data: docsWithUrl,
      docs: docsWithUrl,
      posts: docsWithUrl,
      total: result.total,
      totalDocs: result.total,
      limit: $limit,
      page: $page,
      offset,
      hasNextPage: $page < totalPages,
      hasPrevPage: $page > 1,
    });
  } catch (error) {
    console.error("[Docs API] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch documents", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
