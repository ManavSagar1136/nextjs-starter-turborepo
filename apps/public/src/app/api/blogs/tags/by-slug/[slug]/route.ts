import { NextRequest, NextResponse } from "next/server";
import { prisma, getBlogTagBySlug, listBlogPosts } from "@buildbase/database";

/**
 * GET /api/blogs/tags/by-slug/[slug]
 * Get blog posts by tag slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const searchParams = request.nextUrl.searchParams;
    const $page = parseInt(searchParams.get("$page") || "1");
    const $limit = parseInt(searchParams.get("$limit") || "20");

    const tag = await getBlogTagBySlug(prisma, slug);

    if (!tag || !tag.isPublic) {
      return NextResponse.json({ success: false, message: "Tag not found" }, { status: 404 });
    }

    const result = await listBlogPosts(prisma, {
      published: true,
      tagId: tag.id,
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
      tag,
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
    console.error("[Blog Posts By Tag API] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch blog posts by tag", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
