import { NextRequest, NextResponse } from "next/server";
import { DUMMY_BLOG_TAGS } from "@/data/dummy/blogs";

/**
 * GET /api/blogs/tags/public
 * Get all public blog tags
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const $page = parseInt(searchParams.get("$page") || "1");
    const $limit = parseInt(searchParams.get("$limit") || "100");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort");

    // Filter public tags only
    let filteredTags = DUMMY_BLOG_TAGS.filter((tag) => tag.isPublic);

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredTags = filteredTags.filter(
        (tag) =>
          tag.title.toLowerCase().includes(searchLower) ||
          tag.slug.toLowerCase().includes(searchLower),
      );
    }

    // Apply sorting
    if (sort) {
      const sortObj = JSON.parse(sort);
      filteredTags.sort((a, b) => {
        for (const [key, direction] of Object.entries(sortObj)) {
          const aVal = (a as any)[key];
          const bVal = (b as any)[key];
          if (aVal < bVal) return direction === 1 ? -1 : 1;
          if (aVal > bVal) return direction === 1 ? 1 : -1;
        }
        return 0;
      });
    } else {
      // Default sort by title
      filteredTags.sort((a, b) => a.title.localeCompare(b.title));
    }

    // Apply pagination (if limit is very high, return all)
    const total = filteredTags.length;
    const offset = ($page - 1) * $limit;
    const paginatedTags = $limit >= 10000 ? filteredTags : filteredTags.slice(offset, offset + $limit);

    // Calculate and set the URL for each tag
    const { Routes } = await import("@/data/routes");
    const tagsWithUrl = paginatedTags.map((tag) => ({
      ...tag,
      url: `${Routes.blogTags}/${tag.slug}`,
    }));

    return NextResponse.json(tagsWithUrl);
  } catch (error) {
    console.error("[Blog Tags API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch blog tags",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
