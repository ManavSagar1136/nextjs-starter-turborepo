import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@buildbase/database";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { createBlogFolder, listBlogFolders } from "@buildbase/database";

const createBlogFolderSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().max(100).optional(),
  parentFolderId: z.string().optional().nullable(),
});

async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const search = searchParams.get("search") || undefined;

    const result = await listBlogFolders(prisma, { page, limit, search });

    return NextResponse.json({
      docs: result.data,
      totalDocs: result.total,
      totalPages: result.totalPages,
      page: result.page,
      limit: result.limit,
    });
  } catch (error) {
    console.error("[API] Failed to list blog folders:", error);
    return NextResponse.json({ error: "Failed to fetch blog folders" }, { status: 500 });
  }
}

async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = createBlogFolderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.issues }, { status: 400 });
    }

    const folder = await createBlogFolder(prisma, {
      ...parsed.data,
      parentFolderId: parsed.data.parentFolderId ?? undefined,
    });
    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    console.error("[API] Failed to create blog folder:", error);
    return NextResponse.json({ error: "Failed to create blog folder" }, { status: 500 });
  }
}

export const GET = withAuth(handleGET, [APP_ROLES.ADMIN]);
export const POST = withAuth(handlePOST, [APP_ROLES.ADMIN]);
