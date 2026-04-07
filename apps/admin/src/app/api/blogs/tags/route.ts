import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@buildbase/database";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { createBlogTag, listBlogTags } from "@buildbase/database";

const createBlogTagSchema = z.object({
  title: z.string().min(1).max(100),
  slug: z.string().max(100).optional(),
  isPublic: z.boolean().default(true),
});

async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const search = searchParams.get("search") || undefined;
    const isPublic = searchParams.get("isPublic");

    const result = await listBlogTags(prisma, {
      page,
      limit,
      search,
      isPublic: isPublic !== null ? isPublic === "true" : undefined,
    });

    return NextResponse.json({
      docs: result.data,
      totalDocs: result.total,
      totalPages: result.totalPages,
      page: result.page,
      limit: result.limit,
    });
  } catch (error) {
    console.error("[API] Failed to list blog tags:", error);
    return NextResponse.json({ error: "Failed to fetch blog tags" }, { status: 500 });
  }
}

async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = createBlogTagSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.issues }, { status: 400 });
    }

    const tag = await createBlogTag(prisma, parsed.data);
    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error("[API] Failed to create blog tag:", error);
    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create blog tag" }, { status: 500 });
  }
}

export const GET = withAuth(handleGET, [APP_ROLES.ADMIN]);
export const POST = withAuth(handlePOST, [APP_ROLES.ADMIN]);
