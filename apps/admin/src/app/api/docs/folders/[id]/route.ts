import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@buildbase/database";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { getDocFolderById, updateDocFolder, deleteDocFolder } from "@buildbase/database";

type RouteContext = { params: Promise<{ id: string }> };

async function handleGET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const folder = await getDocFolderById(prisma, id);

    if (!folder) {
      return NextResponse.json({ error: "Doc folder not found" }, { status: 404 });
    }

    return NextResponse.json(folder);
  } catch (error) {
    console.error("[API] Failed to get doc folder:", error);
    return NextResponse.json({ error: "Failed to fetch doc folder" }, { status: 500 });
  }
}

async function handlePATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const folder = await updateDocFolder(prisma, id, {
      name: body.name,
      slug: body.slug,
      parentFolderId: body.parentFolderId,
    });
    return NextResponse.json(folder);
  } catch (error) {
    console.error("[API] Failed to update doc folder:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Doc folder not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update doc folder" }, { status: 500 });
  }
}

async function handleDELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteDocFolder(prisma, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Failed to delete doc folder:", error);
    return NextResponse.json({ error: "Failed to delete doc folder" }, { status: 500 });
  }
}

export const GET = withAuth(handleGET, [APP_ROLES.ADMIN]);
export const PATCH = withAuth(handlePATCH, [APP_ROLES.ADMIN]);
export const DELETE = withAuth(handleDELETE, [APP_ROLES.ADMIN]);
