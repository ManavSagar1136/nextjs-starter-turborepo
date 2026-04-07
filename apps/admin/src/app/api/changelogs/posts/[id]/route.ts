import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@buildbase/database";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { getChangelogPostById, updateChangelogPost, deleteChangelogPost } from "@buildbase/database";

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  version: z.string().min(1).max(50).optional(),
  slug: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  content: z.string().min(1).optional(),
  published: z.boolean().optional(),
  releaseDate: z.string().optional().nullable(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional().nullable(),
  seoKeywords: z.array(z.string()).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

async function handleGET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const post = await getChangelogPostById(prisma, id);

    if (!post || post.deleted) {
      return NextResponse.json({ error: "Changelog post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("[API] Failed to get changelog post:", error);
    return NextResponse.json({ error: "Failed to fetch changelog post" }, { status: 500 });
  }
}

async function handlePATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const user = (request as any).authenticatedUser;

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.issues }, { status: 400 });
    }

    const existing = await getChangelogPostById(prisma, id);
    if (!existing || existing.deleted) {
      return NextResponse.json({ error: "Changelog post not found" }, { status: 404 });
    }

    const data = parsed.data;

    // Auto-set publishedAt when publishing
    let publishedAt: Date | null | undefined = undefined;
    if (data.published === true && !existing.published) {
      publishedAt = new Date();
    } else if (data.published === false) {
      publishedAt = null;
    }

    const post = await updateChangelogPost(prisma, id, {
      ...data,
      releaseDate: data.releaseDate !== undefined ? (data.releaseDate ? new Date(data.releaseDate) : null) : undefined,
      publishedAt,
      updatedById: user?.userId,
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("[API] Failed to update changelog post:", error);
    return NextResponse.json({ error: "Failed to update changelog post" }, { status: 500 });
  }
}

async function handleDELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const user = (request as any).authenticatedUser;

    const existing = await getChangelogPostById(prisma, id);
    if (!existing || existing.deleted) {
      return NextResponse.json({ error: "Changelog post not found" }, { status: 404 });
    }

    if (existing.published) {
      return NextResponse.json({ error: "Cannot delete a published changelog. Unpublish it first." }, { status: 422 });
    }

    await deleteChangelogPost(prisma, id, user?.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Failed to delete changelog post:", error);
    return NextResponse.json({ error: "Failed to delete changelog post" }, { status: 500 });
  }
}

export const GET = withAuth(handleGET, [APP_ROLES.ADMIN]);
export const PATCH = withAuth(handlePATCH, [APP_ROLES.ADMIN]);
export const DELETE = withAuth(handleDELETE, [APP_ROLES.ADMIN]);
