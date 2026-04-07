import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@buildbase/database";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { createBlogAuthor, listBlogAuthors } from "@buildbase/database";

async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const search = searchParams.get("search") || undefined;

    const result = await listBlogAuthors(prisma, { page, limit, search });

    return NextResponse.json({
      docs: result.data,
      totalDocs: result.total,
      totalPages: result.totalPages,
      page: result.page,
      limit: result.limit,
    });
  } catch (error) {
    console.error("[API] Failed to list blog authors:", error);
    return NextResponse.json({ error: "Failed to fetch blog authors" }, { status: 500 });
  }
}

async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.username) {
      return NextResponse.json({ error: "Missing required fields: name, username" }, { status: 400 });
    }

    const author = await createBlogAuthor(prisma, {
      name: body.name,
      username: body.username,
      image: body.image,
      links: body.links,
    });
    return NextResponse.json(author, { status: 201 });
  } catch (error) {
    console.error("[API] Failed to create blog author:", error);
    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create blog author" }, { status: 500 });
  }
}

export const GET = withAuth(handleGET, [APP_ROLES.ADMIN]);
export const POST = withAuth(handlePOST, [APP_ROLES.ADMIN]);
