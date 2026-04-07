import { NextRequest, NextResponse } from "next/server";
import { prisma, getBlogPostByPath } from "@buildbase/database";

/**
 * GET /api/blogs/path?path=...
 * Get blog post by path
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json({ success: false, message: "Path parameter is required" }, { status: 400 });
    }

    const post = await getBlogPostByPath(prisma, path.toLowerCase().trim());

    if (!post) {
      return NextResponse.json({ success: false, message: "Blog post not found" }, { status: 404 });
    }

    const { computePostUrl } = await import("@/lib/blogs/blog-url.service");
    const postWithUrl = { ...post, url: computePostUrl(post as any) };

    return NextResponse.json(postWithUrl);
  } catch (error) {
    console.error("[Blogs Path API] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch blog post", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
