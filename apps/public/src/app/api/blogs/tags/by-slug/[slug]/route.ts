import { NextRequest, NextResponse } from "next/server";
import { DUMMY_BLOG_POSTS, DUMMY_BLOG_TAGS } from "@/data/dummy/blogs";

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

    // Find tag by slug
    const tag = DUMMY_BLOG_TAGS.find(
      (t) => t.slug === slug || t.slug === slug.replace(/^\/blogs\/tags\//, ""),
    );

    if (!tag || !tag.isPublic) {
      return NextResponse.json(
        {
          success: false,
          message: "Tag not found",
        },
        { status: 404 },
      );
    }

    // Filter posts by tag
    let filteredPosts = DUMMY_BLOG_POSTS.filter(
      (post) =>
        post.published &&
        post.tags?.some((t) => t.id === tag.id || t.slug === tag.slug),
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

    // Calculate and set the URL for each post
    const { computePostUrl } = await import("@/lib/blogs/blog-url.service");
    const postsWithUrl = paginatedPosts.map((post) => ({
      ...post,
      url: computePostUrl(post),
    }));

    return NextResponse.json({
      tag,
      data: postsWithUrl,
      docs: postsWithUrl,
      total,
      totalDocs: total,
      limit: $limit,
      page: $page,
      offset,
      hasNextPage: $page < totalPages,
      hasPrevPage: $page > 1,
    });
  } catch (error) {
    console.error("[Blog Posts By Tag API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch blog posts by tag",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
