import { NextRequest, NextResponse } from "next/server";
import { DUMMY_BLOG_POSTS } from "@/data/dummy/blogs";

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
    const folderId = searchParams.get("folderId");
    const tagId = searchParams.get("tagId");
    const authorId = searchParams.get("authorId");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort");

    // Filter published posts only
    let filteredPosts = DUMMY_BLOG_POSTS.filter((post) => post.published);

    // Apply filters
    if (featured === "true") {
      filteredPosts = filteredPosts.filter((post) => post.featured);
    }
    if (folderId) {
      filteredPosts = filteredPosts.filter((post) => post.folderId === folderId);
    }
    if (tagId) {
      filteredPosts = filteredPosts.filter((post) =>
        post.tags?.some((tag) => tag.id === tagId),
      );
    }
    if (authorId) {
      filteredPosts = filteredPosts.filter((post) =>
        post.authors?.some((author) => author.id === authorId),
      );
    }
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPosts = filteredPosts.filter(
        (post) =>
          post.title.toLowerCase().includes(searchLower) ||
          post.description.toLowerCase().includes(searchLower) ||
          post.excerpt?.toLowerCase().includes(searchLower),
      );
    }

    // Apply sorting
    if (sort) {
      const sortObj = JSON.parse(sort);
      filteredPosts.sort((a, b) => {
        for (const [key, direction] of Object.entries(sortObj)) {
          const aVal = (a as any)[key];
          const bVal = (b as any)[key];
          if (aVal < bVal) return direction === 1 ? -1 : 1;
          if (aVal > bVal) return direction === 1 ? 1 : -1;
        }
        return 0;
      });
    } else {
      // Default sort by publishedAt desc
      filteredPosts.sort(
        (a, b) =>
          new Date(b.publishedAt || 0).getTime() -
          new Date(a.publishedAt || 0).getTime(),
      );
    }

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
      data: postsWithUrl,
      docs: postsWithUrl, // Backward compatibility
      total,
      totalDocs: total,
      limit: $limit,
      page: $page,
      offset,
      hasNextPage: $page < totalPages,
      hasPrevPage: $page > 1,
    });
  } catch (error) {
    console.error("[Blogs API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch blog posts",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
