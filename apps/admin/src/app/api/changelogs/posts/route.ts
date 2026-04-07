import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@buildbase/database";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { createChangelogPost, listChangelogPosts } from "@buildbase/database";

const createSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  version: z.string().min(1, "Version is required").max(50),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(200)
    .regex(/^v[a-z0-9][a-z0-9.\-]*$/, "Slug must start with 'v' followed by alphanumeric characters, dots, or hyphens"),
  description: z.string().optional().nullable(),
  content: z.string().min(1, "Content is required"),
  published: z.boolean().default(false),
  releaseDate: z.string().optional().nullable(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional().nullable(),
  seoKeywords: z.array(z.string()).default([]),
});

async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 200);
    const search = searchParams.get("search") || undefined;
    const published = searchParams.get("published");

    const result = await listChangelogPosts(prisma, {
      page,
      limit,
      search,
      includeDeleted: false,
      published: published !== null ? published === "true" : undefined,
    });

    return NextResponse.json({
      docs: result.data,
      totalDocs: result.total,
      totalPages: result.totalPages,
      page: result.page,
      limit: result.limit,
    });
  } catch (error) {
    console.error("[Changelogs API] Failed to list posts:", error);
    return NextResponse.json({ error: "Failed to fetch changelog posts" }, { status: 500 });
  }
}

async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();
    const user = (request as any).authenticatedUser;

    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.issues }, { status: 400 });
    }

    const data = parsed.data;
    const publishedAt = data.published ? new Date() : null;

    // Pre-check uniqueness to return a clear error before hitting DB constraint
    const [existingSlug, existingVersion] = await Promise.all([
      prisma.changelogPost.findFirst({ where: { slug: data.slug, deleted: false } }),
      prisma.changelogPost.findFirst({ where: { version: data.version, deleted: false } }),
    ]);

    if (existingSlug) {
      return NextResponse.json({ error: `A changelog with slug "${data.slug}" already exists.` }, { status: 409 });
    }
    if (existingVersion) {
      return NextResponse.json({ error: `A changelog for version "${data.version}" already exists.` }, { status: 409 });
    }

    const post = await createChangelogPost(prisma, {
      title: data.title,
      slug: data.slug,
      version: data.version,
      description: data.description ?? null,
      content: data.content,
      published: data.published,
      publishedAt,
      releaseDate: data.releaseDate ? new Date(data.releaseDate) : null,
      seoTitle: data.seoTitle || data.title,
      seoDescription: data.seoDescription ?? null,
      seoKeywords: data.seoKeywords,
      createdById: user?.userId,
      updatedById: user?.userId,
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("[Changelogs API] Failed to create post:", error);
    // Prisma unique constraint fallback
    if ((error as any)?.code === "P2002") {
      const field = (error as any)?.meta?.target?.[0] ?? "field";
      return NextResponse.json({ error: `A changelog with this ${field} already exists.` }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create changelog post" }, { status: 500 });
  }
}

export const GET = withAuth(handleGET, [APP_ROLES.ADMIN]);
export const POST = withAuth(handlePOST, [APP_ROLES.ADMIN]);
