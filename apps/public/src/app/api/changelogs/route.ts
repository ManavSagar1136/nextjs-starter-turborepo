import { NextRequest, NextResponse } from "next/server";
import { prisma, listChangelogPosts } from "@buildbase/database";
import { computeChangelogUrl } from "@/lib/changelogs/changelog-url.service";

// GET /api/changelogs - List published changelogs (public, no auth required)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const $page = parseInt(searchParams.get("$page") || "1");
    const $limit = parseInt(searchParams.get("$limit") || "20");
    const search = searchParams.get("search") || undefined;

    const result = await listChangelogPosts(prisma, {
      published: true,
      includeDeleted: false,
      search,
      page: $page,
      limit: $limit >= 10000 ? 10000 : $limit,
    });

    const changelogsWithUrl = result.data.map((changelog: any) => ({
      ...changelog,
      url: computeChangelogUrl(changelog),
    }));

    const offset = ($page - 1) * $limit;

    return NextResponse.json({
      data: changelogsWithUrl,
      total: result.total,
      limit: $limit,
      page: $page,
      offset,
      totalPages: result.totalPages,
      hasNextPage: $page < result.totalPages,
      hasPrevPage: $page > 1,
    });
  } catch (error) {
    console.error("[Changelogs API] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch changelogs", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
