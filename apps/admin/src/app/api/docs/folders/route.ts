import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@buildbase/database";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { createDocFolder, listDocFolders } from "@buildbase/database";

async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const search = searchParams.get("search") || undefined;

    const result = await listDocFolders(prisma, { page, limit, search });

    return NextResponse.json({
      docs: result.data,
      totalDocs: result.total,
      totalPages: result.totalPages,
      page: result.page,
      limit: result.limit,
    });
  } catch (error) {
    console.error("[API] Failed to list doc folders:", error);
    return NextResponse.json({ error: "Failed to fetch doc folders" }, { status: 500 });
  }
}

async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json({ error: "Missing required field: name" }, { status: 400 });
    }

    const folder = await createDocFolder(prisma, {
      name: body.name,
      slug: body.slug,
      parentFolderId: body.parentFolderId,
    });
    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    console.error("[API] Failed to create doc folder:", error);
    return NextResponse.json({ error: "Failed to create doc folder" }, { status: 500 });
  }
}

export const GET = withAuth(handleGET, [APP_ROLES.ADMIN]);
export const POST = withAuth(handlePOST, [APP_ROLES.ADMIN]);
