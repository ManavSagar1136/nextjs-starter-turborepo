import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@buildbase/database";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { updateBlogPostAuthors } from "@buildbase/database";

type RouteContext = { params: Promise<{ id: string }> };

async function handlePATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    if (!Array.isArray(body.authorIds)) {
      return NextResponse.json({ error: "authorIds must be an array" }, { status: 400 });
    }

    await updateBlogPostAuthors(prisma, id, body.authorIds);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Failed to update blog post authors:", error);
    return NextResponse.json({ error: "Failed to update authors" }, { status: 500 });
  }
}

export const PATCH = withAuth(handlePATCH, [APP_ROLES.ADMIN]);
