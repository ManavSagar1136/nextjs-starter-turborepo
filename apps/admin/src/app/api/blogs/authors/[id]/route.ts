import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@buildbase/database";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { getBlogAuthorById, updateBlogAuthor, deleteBlogAuthor } from "@buildbase/database";

type RouteContext = { params: Promise<{ id: string }> };

async function handleGET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const author = await getBlogAuthorById(prisma, id);

    if (!author) {
      return NextResponse.json({ error: "Blog author not found" }, { status: 404 });
    }

    return NextResponse.json(author);
  } catch (error) {
    console.error("[API] Failed to get blog author:", error);
    return NextResponse.json({ error: "Failed to fetch blog author" }, { status: 500 });
  }
}

async function handlePATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const author = await updateBlogAuthor(prisma, id, {
      name: body.name,
      username: body.username,
      image: body.image,
      links: body.links,
    });
    return NextResponse.json(author);
  } catch (error) {
    console.error("[API] Failed to update blog author:", error);
    return NextResponse.json({ error: "Failed to update blog author" }, { status: 500 });
  }
}

async function handleDELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteBlogAuthor(prisma, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Failed to delete blog author:", error);
    return NextResponse.json({ error: "Failed to delete blog author" }, { status: 500 });
  }
}

export const GET = withAuth(handleGET, [APP_ROLES.ADMIN]);
export const PATCH = withAuth(handlePATCH, [APP_ROLES.ADMIN]);
export const DELETE = withAuth(handleDELETE, [APP_ROLES.ADMIN]);
