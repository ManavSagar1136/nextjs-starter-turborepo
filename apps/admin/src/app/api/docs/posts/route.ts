import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@buildbase/database";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { createDocPost, listDocPosts } from "@buildbase/database";

async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || undefined;
    const published = searchParams.get("published");
    const folderId = searchParams.get("folderId") || undefined;

    const result = await listDocPosts(prisma, {
      page,
      limit,
      search,
      published: published !== null ? published === "true" : undefined,
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
    console.error("[API] Failed to list doc posts:", error);
    return NextResponse.json({ error: "Failed to fetch doc posts" }, { status: 500 });
  }
}

async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();
    const user = (request as any).authenticatedUser;

    if (!body.title || !body.content) {
      return NextResponse.json({ error: "Missing required fields: title, content" }, { status: 400 });
    }

    const post = await createDocPost(prisma, body, user?.userId);
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("[API] Failed to create doc post:", error);
    return NextResponse.json({ error: "Failed to create doc post" }, { status: 500 });
  }
}

export const GET = withAuth(handleGET, [APP_ROLES.ADMIN]);
export const POST = withAuth(handlePOST, [APP_ROLES.ADMIN]);
