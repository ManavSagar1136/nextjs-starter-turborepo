import { NextRequest, NextResponse } from "next/server";
import { prisma, getChangelogPostBySlug } from "@buildbase/database";
import { computeChangelogUrl } from "@/lib/changelogs/changelog-url.service";

// GET /api/changelogs/[slug] - Get published changelog by slug (public, no auth required)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const post = await getChangelogPostBySlug(prisma, slug);

    if (!post || post.deleted) {
      return NextResponse.json({ error: "Changelog not found" }, { status: 404 });
    }

    if (!post.published) {
      return NextResponse.json({ error: "Changelog not found" }, { status: 404 });
    }

    return NextResponse.json({ ...post, url: computeChangelogUrl(post) });
  } catch (error) {
    console.error("[Changelogs API] Error fetching by slug:", error);
    return NextResponse.json(
      { error: "Failed to fetch changelog" },
      { status: 500 },
    );
  }
}
