import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@buildbase/database";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { getBlogFolderById, updateBlogFolder, deleteBlogFolder } from "@buildbase/database";

type RouteContext = { params: Promise<{ id: string }> };

async function handleGET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const folder = await getBlogFolderById(prisma, id);

    if (!folder) {
      return NextResponse.json({ error: "Blog folder not found" }, { status: 404 });
    }

    return NextResponse.json(folder);
  } catch (error) {
    console.error("[API] Failed to get blog folder:", error);
    return NextResponse.json({ error: "Failed to fetch blog folder" }, { status: 500 });
  }
}

async function handlePATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const folder = await updateBlogFolder(prisma, id, {
      name: body.name,
      slug: body.slug,
      parentFolderId: body.parentFolderId,
    });
    return NextResponse.json(folder);
  } catch (error) {
    console.error("[API] Failed to update blog folder:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Blog folder not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update blog folder" }, { status: 500 });
  }
}

async function handleDELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteBlogFolder(prisma, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Failed to delete blog folder:", error);
    return NextResponse.json({ error: "Failed to delete blog folder" }, { status: 500 });
  }
}

export const GET = withAuth(handleGET, [APP_ROLES.ADMIN]);
export const PATCH = withAuth(handlePATCH, [APP_ROLES.ADMIN]);
export const DELETE = withAuth(handleDELETE, [APP_ROLES.ADMIN]);
