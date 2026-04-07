import { NextRequest, NextResponse } from "next/server";
import { prisma, listBlogPosts } from "@buildbase/database";

/**
 * GET /api/blogs
 * Get all published blog posts with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const $page = parseInt(searchParams.get("$page") || "1");
    const $limit = parseInt(searchParams.get("$limit") || "20");
    const featured = searchParams.get("featured");
    const folderId = searchParams.get("folderId") || undefined;
    const tagId = searchParams.get("tagId") || undefined;
    const authorId = searchParams.get("authorId") || undefined;
    const search = searchParams.get("search") || undefined;

    const result = await listBlogPosts(prisma, {
      published: true,
      featured: featured !== null ? featured === "true" : undefined,
      folderId,
      tagId,
      authorId,
      search,
      page: $page,
      limit: $limit,
    });

    const { computePostUrl } = await import("@/lib/blogs/blog-url.service");
    const postsWithUrl = result.data.map((post: any) => ({
      ...post,
      url: computePostUrl(post),
    }));

    const totalPages = result.totalPages;
    const offset = ($page - 1) * $limit;

    return NextResponse.json({
      data: postsWithUrl,
      docs: postsWithUrl,
      total: result.total,
      totalDocs: result.total,
      limit: $limit,
      page: $page,
      offset,
      hasNextPage: $page < totalPages,
      hasPrevPage: $page > 1,
    });
  } catch (error) {
    console.error("[Blogs API] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch blog posts", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
