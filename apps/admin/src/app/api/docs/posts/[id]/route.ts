import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@buildbase/database";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { getDocPostById, updateDocPost, deleteDocPost } from "@buildbase/database";

const updateDocPostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().max(200).optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  content: z.string().min(1).optional(),
  order: z.number().int().optional().nullable(),
  folderId: z.string().optional().nullable(),
  published: z.boolean().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.array(z.string()).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

async function handleGET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const post = await getDocPostById(prisma, id);

    if (!post) {
      return NextResponse.json({ error: "Doc post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("[API] Failed to get doc post:", error);
    return NextResponse.json({ error: "Failed to fetch doc post" }, { status: 500 });
  }
}

async function handlePATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const user = (request as any).authenticatedUser;

    const parsed = updateDocPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.issues }, { status: 400 });
    }

    const post = await updateDocPost(prisma, id, parsed.data, user?.userId);
    return NextResponse.json(post);
  } catch (error) {
    console.error("[API] Failed to update doc post:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Doc post not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update doc post" }, { status: 500 });
  }
}

async function handleDELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteDocPost(prisma, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Failed to delete doc post:", error);
    return NextResponse.json({ error: "Failed to delete doc post" }, { status: 500 });
  }
}

export const GET = withAuth(handleGET, [APP_ROLES.ADMIN]);
export const PATCH = withAuth(handlePATCH, [APP_ROLES.ADMIN]);
export const DELETE = withAuth(handleDELETE, [APP_ROLES.ADMIN]);
