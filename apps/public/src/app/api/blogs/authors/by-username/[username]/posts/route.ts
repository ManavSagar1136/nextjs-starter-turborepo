import { NextRequest, NextResponse } from "next/server";
import { prisma, getBlogAuthorByUsername, listBlogPosts } from "@buildbase/database";

/**
 * GET /api/blogs/authors/by-username/[username]/posts
 * Get blog posts by author username
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username } = await params;
    const searchParams = request.nextUrl.searchParams;
    const $page = parseInt(searchParams.get("$page") || "1");
    const $limit = parseInt(searchParams.get("$limit") || "20");

    const author = await getBlogAuthorByUsername(prisma, username);

    if (!author) {
      return NextResponse.json({ success: false, message: "Author not found" }, { status: 404 });
    }

    const result = await listBlogPosts(prisma, {
      published: true,
      authorId: author.id,
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
      author,
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
    console.error("[Blog Posts By Author API] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch blog posts by author", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
