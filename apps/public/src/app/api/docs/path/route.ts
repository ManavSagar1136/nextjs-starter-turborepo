import { NextRequest, NextResponse } from "next/server";
import { prisma, getDocPostByPath } from "@buildbase/database";

/**
 * GET /api/docs/path?path=...
 * Get document by path
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json({ success: false, message: "Path parameter is required" }, { status: 400 });
    }

    const doc = await getDocPostByPath(prisma, path.toLowerCase().trim());

    if (!doc) {
      return NextResponse.json({ success: false, message: "Document not found" }, { status: 404 });
    }

    const { computeDocUrl } = await import("@/lib/docs/doc-url.service");
    const docWithUrl = { ...doc, url: computeDocUrl(doc as any) };

    return NextResponse.json(docWithUrl);
  } catch (error) {
    console.error("[Docs Path API] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch document", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
