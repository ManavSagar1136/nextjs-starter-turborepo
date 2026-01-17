import { NextRequest, NextResponse } from "next/server";
import { DUMMY_BLOG_POSTS, DUMMY_BLOG_AUTHORS } from "@/data/dummy/blogs";

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

    // Find author by username
    const author = DUMMY_BLOG_AUTHORS.find((a) => a.username === username);

    if (!author) {
      return NextResponse.json(
        {
          success: false,
          message: "Author not found",
        },
        { status: 404 },
      );
    }

    // Filter posts by author
    let filteredPosts = DUMMY_BLOG_POSTS.filter(
      (post) =>
        post.published &&
        post.authors?.some((a) => a.id === author.id || a.username === username),
    );

    // Sort by publishedAt desc
    filteredPosts.sort(
      (a, b) =>
        new Date(b.publishedAt || 0).getTime() -
        new Date(a.publishedAt || 0).getTime(),
    );

    // Apply pagination
    const total = filteredPosts.length;
    const offset = ($page - 1) * $limit;
    const paginatedPosts = filteredPosts.slice(offset, offset + $limit);
    const totalPages = Math.ceil(total / $limit);

    return NextResponse.json({
      author,
      data: paginatedPosts,
      docs: paginatedPosts,
      total,
      totalDocs: total,
      limit: $limit,
      page: $page,
      offset,
      hasNextPage: $page < totalPages,
      hasPrevPage: $page > 1,
    });
  } catch (error) {
    console.error("[Blog Posts By Author API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch blog posts by author",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
