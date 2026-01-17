import { NextRequest, NextResponse } from "next/server";
import { DUMMY_DOC_POSTS } from "@/data/dummy/docs";

/**
 * GET /api/docs
 * Get all published documents with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const $page = parseInt(searchParams.get("$page") || "1");
    const $limit = parseInt(searchParams.get("$limit") || "20");
    const folderId = searchParams.get("folderId");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort");

    // Filter published docs only
    let filteredDocs = DUMMY_DOC_POSTS.filter((doc) => doc.published);

    // Apply filters
    if (folderId) {
      filteredDocs = filteredDocs.filter((doc) => doc.folderId === folderId);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      filteredDocs = filteredDocs.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchLower) ||
          doc.description?.toLowerCase().includes(searchLower) ||
          doc.subtitle?.toLowerCase().includes(searchLower),
      );
    }

    // Apply sorting
    if (sort) {
      const sortObj = JSON.parse(sort);
      filteredDocs.sort((a, b) => {
        for (const [key, direction] of Object.entries(sortObj)) {
          const aVal = (a as any)[key];
          const bVal = (b as any)[key];
          if (aVal < bVal) return direction === 1 ? -1 : 1;
          if (aVal > bVal) return direction === 1 ? 1 : -1;
        }
        return 0;
      });
    } else {
      // Default sort by order or publishedAt desc
      filteredDocs.sort((a, b) => {
        if (a.order !== null && b.order !== null) {
          return (a.order || 0) - (b.order || 0);
        }
        if (a.order !== null) return -1;
        if (b.order !== null) return 1;
        return (
          new Date(b.publishedAt || 0).getTime() -
          new Date(a.publishedAt || 0).getTime()
        );
      });
    }

    // Apply pagination
    const total = filteredDocs.length;
    const offset = ($page - 1) * $limit;
    const paginatedDocs = filteredDocs.slice(offset, offset + $limit);
    const totalPages = Math.ceil(total / $limit);

    // Calculate and set the URL for each doc
    const { computeDocUrl } = await import("@/lib/docs/doc-url.service");
    const docsWithUrl = paginatedDocs.map((doc) => ({
      ...doc,
      url: computeDocUrl(doc),
    }));

    return NextResponse.json({
      data: docsWithUrl,
      docs: docsWithUrl, // Backward compatibility
      posts: docsWithUrl, // Backward compatibility
      total,
      totalDocs: total,
      limit: $limit,
      page: $page,
      offset,
      hasNextPage: $page < totalPages,
      hasPrevPage: $page > 1,
    });
  } catch (error) {
    console.error("[Docs API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch documents",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
