import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@buildbase/database";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { createDocPost, listDocPosts } from "@buildbase/database";

const createDocPostSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().max(200).optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  content: z.string().min(1),
  order: z.number().int().optional().nullable(),
  folderId: z.string().optional().nullable(),
  published: z.boolean().default(false),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.array(z.string()).default([]),
});

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

    const parsed = createDocPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.issues }, { status: 400 });
    }

    const post = await createDocPost(
      prisma,
      {
        ...parsed.data,
        folderId: parsed.data.folderId ?? undefined,
        order: parsed.data.order ?? undefined,
      },
      user?.userId
    );
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("[API] Failed to create doc post:", error);
    return NextResponse.json({ error: "Failed to create doc post" }, { status: 500 });
  }
}

export const GET = withAuth(handleGET, [APP_ROLES.ADMIN]);
export const POST = withAuth(handlePOST, [APP_ROLES.ADMIN]);
