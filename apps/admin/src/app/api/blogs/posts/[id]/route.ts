import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@buildbase/database";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { getBlogPostById, updateBlogPost, deleteBlogPost } from "@buildbase/database";

type RouteContext = { params: Promise<{ id: string }> };

async function handleGET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const post = await getBlogPostById(prisma, id);

    if (!post) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("[API] Failed to get blog post:", error);
    return NextResponse.json({ error: "Failed to fetch blog post" }, { status: 500 });
  }
}

async function handlePATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const user = (request as any).authenticatedUser;

    const post = await updateBlogPost(prisma, id, body, user?.userId);
    return NextResponse.json(post);
  } catch (error) {
    console.error("[API] Failed to update blog post:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update blog post" }, { status: 500 });
  }
}

async function handleDELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteBlogPost(prisma, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Failed to delete blog post:", error);
    return NextResponse.json({ error: "Failed to delete blog post" }, { status: 500 });
  }
}

export const GET = withAuth(handleGET, [APP_ROLES.ADMIN]);
export const PATCH = withAuth(handlePATCH, [APP_ROLES.ADMIN]);
export const DELETE = withAuth(handleDELETE, [APP_ROLES.ADMIN]);
