import { NextRequest, NextResponse } from "next/server";
import { prisma, listBlogTags } from "@buildbase/database";

/**
 * GET /api/blogs/tags/public
 * Get all public blog tags
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const $page = parseInt(searchParams.get("$page") || "1");
    const $limit = parseInt(searchParams.get("$limit") || "100");
    const search = searchParams.get("search") || undefined;

    const result = await listBlogTags(prisma, {
      isPublic: true,
      search,
      page: $page,
      limit: $limit >= 10000 ? 10000 : $limit,
    });

    const { Routes } = await import("@/data/routes");
    const tagsWithUrl = result.data.map((tag: any) => ({
      ...tag,
      url: `${Routes.blogTags}/${tag.slug}`,
    }));

    return NextResponse.json(tagsWithUrl);
  } catch (error) {
    console.error("[Blog Tags API] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch blog tags", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
