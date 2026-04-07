import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@buildbase/database";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { getChangelogPostById, updateChangelogPost, deleteChangelogPost } from "@buildbase/database";

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  version: z.string().min(1).max(50).optional(),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^v[a-z0-9][a-z0-9.\-]*$/, "Slug must start with 'v' followed by alphanumeric characters, dots, or hyphens")
    .optional(),
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
    console.error("[Changelogs API] Failed to get post:", error);
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

    // Block version/slug changes on published changelogs
    if (existing.published) {
      if (data.version && data.version !== existing.version) {
        return NextResponse.json(
          { error: "Cannot change the version of a published changelog. Unpublish it first." },
          { status: 422 }
        );
      }
      if (data.slug && data.slug !== existing.slug) {
        return NextResponse.json(
          { error: "Cannot change the slug of a published changelog. Unpublish it first." },
          { status: 422 }
        );
      }
    }

    // Check uniqueness for version/slug changes
    if (data.version && data.version !== existing.version) {
      const conflict = await prisma.changelogPost.findFirst({
        where: { version: data.version, deleted: false, NOT: { id } },
      });
      if (conflict) {
        return NextResponse.json(
          { error: `A changelog for version "${data.version}" already exists.` },
          { status: 409 }
        );
      }
    }
    if (data.slug && data.slug !== existing.slug) {
      const conflict = await prisma.changelogPost.findFirst({
        where: { slug: data.slug, deleted: false, NOT: { id } },
      });
      if (conflict) {
        return NextResponse.json({ error: `A changelog with slug "${data.slug}" already exists.` }, { status: 409 });
      }
    }

    // Auto-set publishedAt when toggling published
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
    console.error("[Changelogs API] Failed to update post:", error);
    if ((error as any)?.code === "P2002") {
      const field = (error as any)?.meta?.target?.[0] ?? "field";
      return NextResponse.json({ error: `A changelog with this ${field} already exists.` }, { status: 409 });
    }
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
    console.error("[Changelogs API] Failed to delete post:", error);
    return NextResponse.json({ error: "Failed to delete changelog post" }, { status: 500 });
  }
}

export const GET = withAuth(handleGET, [APP_ROLES.ADMIN]);
export const PATCH = withAuth(handlePATCH, [APP_ROLES.ADMIN]);
export const DELETE = withAuth(handleDELETE, [APP_ROLES.ADMIN]);
