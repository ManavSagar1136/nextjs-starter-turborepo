import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@buildbase/database";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { updateBlogPostTags } from "@buildbase/database";

type RouteContext = { params: Promise<{ id: string }> };

async function handlePATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    if (!Array.isArray(body.tagIds)) {
      return NextResponse.json({ error: "tagIds must be an array" }, { status: 400 });
    }

    await updateBlogPostTags(prisma, id, body.tagIds);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Failed to update blog post tags:", error);
    return NextResponse.json({ error: "Failed to update tags" }, { status: 500 });
  }
}

export const PATCH = withAuth(handlePATCH, [APP_ROLES.ADMIN]);
