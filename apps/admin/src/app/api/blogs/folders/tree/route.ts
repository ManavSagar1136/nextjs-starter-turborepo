import { NextResponse } from "next/server";
import { prisma } from "@buildbase/database";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { getBlogFolderTree } from "@buildbase/database";

async function handleGET() {
  try {
    const tree = await getBlogFolderTree(prisma);
    return NextResponse.json(tree);
  } catch (error) {
    console.error("[API] Failed to get blog folder tree:", error);
    return NextResponse.json({ error: "Failed to fetch folder tree" }, { status: 500 });
  }
}

export const GET = withAuth(handleGET, [APP_ROLES.ADMIN]);
