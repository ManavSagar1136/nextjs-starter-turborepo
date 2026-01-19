import { NextRequest, NextResponse } from "next/server";
import { DUMMY_BLOG_POSTS } from "@/data/dummy/blogs";

/**
 * GET /api/blogs/path?path=...
 * Get blog post by path
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

    // Strategy 1: Check if path matches a post's full path (folder.path + "/" + slug)
    // This handles nested folder structures correctly
    let post = DUMMY_BLOG_POSTS.find(p => {
      if (p.folder?.path) {
        const fullPath = `${p.folder.path}/${p.slug}`.toLowerCase().trim();
        return fullPath === normalizedPath;
      }
      // For posts without folders, match by slug only
      const postSlug = (p.slug || "").toLowerCase().trim();
      return postSlug === normalizedPath && !p.folderId && !p.folder;
    });

    // Strategy 2: If not found, try parsing the path (fallback for edge cases)
    // Parse path: "folder1/folder2/slug" or just "slug"
    if (!post) {
      const parts = path.split("/").filter(Boolean);

      if (parts.length > 0) {
        const slug = parts[parts.length - 1] || "";
        const folderPath = parts.slice(0, -1).join("/");

        const normalizedSlug = slug.toLowerCase().trim();
        const normalizedFolderPath = folderPath ? folderPath.toLowerCase().trim() : "";

        post = DUMMY_BLOG_POSTS.find(p => {
          const postSlug = (p.slug || "").toLowerCase().trim();

          if (normalizedFolderPath) {
            if (postSlug !== normalizedSlug) return false;
            if (p.folder?.path) {
              const postFolderPath = p.folder.path.toLowerCase().trim();
              return postFolderPath === normalizedFolderPath;
            }
            return false;
          } else {
            if (postSlug !== normalizedSlug) return false;
            return !p.folderId && !p.folder;
          }
        });
      }
    }

    if (!post || !post.published) {
      return NextResponse.json(
        {
          success: false,
          message: "Blog post not found",
        },
        { status: 404 }
      );
    }

    // Calculate and set the URL for the post
    const { computePostUrl } = await import("@/lib/blogs/blog-url.service");
    const postWithUrl = {
      ...post,
      url: computePostUrl(post),
    };

    return NextResponse.json(postWithUrl);
  } catch (error) {
    console.error("[Blogs Path API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch blog post",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
