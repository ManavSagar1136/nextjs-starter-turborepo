import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@buildbase/database";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { getBlogTagById, updateBlogTag, deleteBlogTag } from "@buildbase/database";

type RouteContext = { params: Promise<{ id: string }> };

async function handleGET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const tag = await getBlogTagById(prisma, id);

    if (!tag) {
      return NextResponse.json({ error: "Blog tag not found" }, { status: 404 });
    }

    return NextResponse.json(tag);
  } catch (error) {
    console.error("[API] Failed to get blog tag:", error);
    return NextResponse.json({ error: "Failed to fetch blog tag" }, { status: 500 });
  }
}

async function handlePATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const tag = await updateBlogTag(prisma, id, {
      title: body.title,
      slug: body.slug,
      isPublic: body.isPublic,
    });
    return NextResponse.json(tag);
  } catch (error) {
    console.error("[API] Failed to update blog tag:", error);
    return NextResponse.json({ error: "Failed to update blog tag" }, { status: 500 });
  }
}

async function handleDELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteBlogTag(prisma, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Failed to delete blog tag:", error);
    return NextResponse.json({ error: "Failed to delete blog tag" }, { status: 500 });
  }
}

export const GET = withAuth(handleGET, [APP_ROLES.ADMIN]);
export const PATCH = withAuth(handlePATCH, [APP_ROLES.ADMIN]);
export const DELETE = withAuth(handleDELETE, [APP_ROLES.ADMIN]);
