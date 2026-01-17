import { NextRequest, NextResponse } from "next/server";
import { DUMMY_DOC_POSTS } from "@/data/dummy/docs";

/**
 * GET /api/docs/path?path=...
 * Get document by path
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json(
        {
          success: false,
          message: "Path parameter is required",
        },
        { status: 400 }
      );
    }

    // Normalize path for comparison
    const normalizedPath = path.toLowerCase().trim();

    // Strategy 1: Check if path matches a doc's full path (folder.path + "/" + slug)
    // This handles nested folder structures correctly
    let doc = DUMMY_DOC_POSTS.find(d => {
      if (d.folder?.path) {
        const fullPath = `${d.folder.path}/${d.slug}`.toLowerCase().trim();
        return fullPath === normalizedPath;
      }
      // For docs without folders, match by slug only
      const docSlug = (d.slug || "").toLowerCase().trim();
      return docSlug === normalizedPath && !d.folderId && !d.folder;
    });

    // Strategy 2: If not found, try parsing the path (fallback for edge cases)
    // Parse path: "folder1/folder2/slug" or just "slug"
    if (!doc) {
      const parts = path.split("/").filter(Boolean);

      if (parts.length > 0) {
        const slug = parts[parts.length - 1] || "";
        const folderPath = parts.slice(0, -1).join("/");

        const normalizedSlug = slug.toLowerCase().trim();
        const normalizedFolderPath = folderPath ? folderPath.toLowerCase().trim() : "";

        doc = DUMMY_DOC_POSTS.find(d => {
          const docSlug = (d.slug || "").toLowerCase().trim();

          if (normalizedFolderPath) {
            if (docSlug !== normalizedSlug) return false;
            if (d.folder?.path) {
              const docFolderPath = d.folder.path.toLowerCase().trim();
              return docFolderPath === normalizedFolderPath;
            }
            return false;
          } else {
            if (docSlug !== normalizedSlug) return false;
            return !d.folderId && !d.folder;
          }
        });
      }
    }

    if (!doc || !doc.published) {
      return NextResponse.json(
        {
          success: false,
          message: "Document not found",
        },
        { status: 404 }
      );
    }

    // Calculate and set the URL for the doc
    const { computeDocUrl } = await import("@/lib/docs/doc-url.service");
    const docWithUrl = {
      ...doc,
      url: computeDocUrl(doc),
    };

    return NextResponse.json(docWithUrl);
  } catch (error) {
    console.error("[Docs Path API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch document",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
