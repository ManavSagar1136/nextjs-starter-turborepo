import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@buildbase/database";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { getBlogPostById, updateBlogPost, deleteBlogPost } from "@buildbase/database";

const updateBlogPostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().max(200).optional(),
  description: z.string().min(1).optional(),
  excerpt: z.string().max(1000).optional().nullable(),
  content: z.string().min(1).optional(),
  image: z.string().url().optional().nullable(),
  imageTitle: z.string().optional().nullable(),
  assetFileId: z.string().optional().nullable(),
  folderId: z.string().optional().nullable(),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.array(z.string()).optional(),
});

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

    const parsed = updateBlogPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.issues }, { status: 400 });
    }

    const post = await updateBlogPost(prisma, id, parsed.data, user?.userId);
    return NextResponse.json(post);
  } catch (error) {
    console.error("[API] Failed to update blog post:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }
    if (error instanceof Error && error.message.includes("Cannot change")) {
      return NextResponse.json({ error: error.message }, { status: 422 });
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
