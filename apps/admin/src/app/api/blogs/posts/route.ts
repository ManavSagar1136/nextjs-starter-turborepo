import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@buildbase/database";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { createBlogPost, listBlogPosts } from "@buildbase/database";

async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || undefined;
    const published = searchParams.get("published");
    const featured = searchParams.get("featured");
    const folderId = searchParams.get("folderId") || undefined;

    const result = await listBlogPosts(prisma, {
      page,
      limit,
      search,
      published: published !== null ? published === "true" : undefined,
      featured: featured !== null ? featured === "true" : undefined,
      folderId,
    });

    return NextResponse.json({
      docs: result.data,
      totalDocs: result.total,
      totalPages: result.totalPages,
      page: result.page,
      limit: result.limit,
    });
  } catch (error) {
    console.error("[API] Failed to list blog posts:", error);
    return NextResponse.json({ error: "Failed to fetch blog posts" }, { status: 500 });
  }
}

async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();
    const user = (request as any).authenticatedUser;

    if (!body.title || !body.description || !body.content) {
      return NextResponse.json({ error: "Missing required fields: title, description, content" }, { status: 400 });
    }

    const post = await createBlogPost(prisma, body, user?.userId);
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("[API] Failed to create blog post:", error);
    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create blog post" }, { status: 500 });
  }
}

export const GET = withAuth(handleGET, [APP_ROLES.ADMIN]);
export const POST = withAuth(handlePOST, [APP_ROLES.ADMIN]);
