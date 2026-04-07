import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Routes } from "@/data/routes";
import { generateSEOMetadata } from "@/utils/seo";

import { SiteConfig } from "@/config";
import { API } from "@/services";
import type { IDocPost } from "@/services/docs";
import { DocFolderService } from "@/lib/docs/doc-folder.service";

import DynamicDocPage from "@/components/doc/DocPage";
import DocRenderer from "@/components/doc/DocRenderer";
import GroupRender from "@/components/doc/GroupRender";

// Force static generation
export const dynamic = "force-static";
export const revalidate = 3600;

/**
 * Generates all possible static paths for documentation pages and folders.
 * Used by Next.js for static generation at build time.
 */
export async function generateStaticParams() {
  try {
    const [postsResult, foldersResult] = await Promise.all([
      API.docs.getAllPublished({
        $page: 1,
        $limit: 10000,
      }),
      API.docs.getFolders({
        tree: true,
      }),
    ]);

    const posts = Array.isArray(postsResult)
      ? postsResult
      : postsResult?.data || postsResult?.docs || [];
    const folders = Array.isArray(foldersResult) ? foldersResult : [];

    // Flatten folder tree structure
    const flattenFolders = (folders: any[]): any[] => {
      const result: any[] = [];
      folders.forEach((folder) => {
        result.push(folder);
        if (folder.subFolders) {
          result.push(...flattenFolders(folder.subFolders));
        }
      });
      return result;
    };
    const allFolders = flattenFolders(folders);

    // Generate paths for all documents
    const docParams = posts.map((post: any) => {
      const slug = post.slug || post.path || post.id;
      const slugArray = typeof slug === "string" ? slug.split("/") : slug;
      return {
        slug: slugArray,
      };
    });

    // Generate paths for all folders
    const folderParams = allFolders.map((folder: any) => {
      const path = folder.path || folder.slug || folder.id;
      const slugArray = typeof path === "string" ? path.split("/") : path;
      return {
        slug: slugArray,
      };
    });

    // Combine both docs and folders
    return [...docParams, ...folderParams];
  } catch (error: any) {
    // Only log non-connection errors to reduce build noise
    const errorCode = error?.code || error?.cause?.code;
    if (errorCode !== "ECONNREFUSED") {
      console.error("Error generating static params for docs:", {
        message: error?.message || error?.data?.message || "Unknown error",
        code: errorCode,
      });
    }
    return [];
  }
}

/**
 * Props for the dynamic docs page.
 * - params: Promise resolving to an object containing the slug array
 */
interface PostPageProps {
  params: Promise<{ slug: string[] }>;
}

/**
 * Generates dynamic SEO metadata based on whether the current item is a doc or a folder.
 *
 * @param params - PostPageProps containing a Promise for params object with slug
 * @returns SEO metadata for the current docs page
 */
export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const paramsResolved = await params;
  const slugArray = paramsResolved.slug;
  const path = slugArray.join("/");

  try {
    // Try to get as document first
    const post = await API.docs.getByPath(path);

    if (post && post.published) {
      const seoTitle = post.seoTitle || post.title;
      // Return SEO metadata for an individual document
      return generateSEOMetadata({
        title: seoTitle,
        description: post.seoDescription || post.description || "",
        url: `${SiteConfig.baseUrl}${Routes.docs}/${path}`,
        type: "article",
        keywords: post.seoKeywords || [],
      });
    }

    // Try to get as folder
    const folder = await DocFolderService.getFolderByPath(path, false);

    if (folder) {
      const folderName = folder.name;
      const folderUrl = `${SiteConfig.baseUrl}${Routes.docs}/${path}`;

      return generateSEOMetadata({
        title: `${folderName} - Documentation`,
        description: `Explore documentations for ${folderName.toLowerCase()}. Comprehensive resources and tutorials to help you master the topic.`,
        url: folderUrl,
        type: "website",
      });
    }
  } catch (error: any) {
    // Only log non-404 errors
    const errorStatus = error?.status || error?.response?.status || error?.statusCode;
    if (errorStatus !== 404) {
      console.error("Error generating metadata:", {
        message: error?.message || error?.data?.message || "Unknown error",
        status: errorStatus,
        path,
      });
    }
  }

  // Not found
  return notFound();
}

/**
 * Dynamic docs route component.
 * If the slug points to a doc, renders that doc.
 * If the slug points to a folder, renders the folder listing.
 * Otherwise, shows a 404.
 *
 * @param props - PostPageProps with params Promise
 * @returns JSX.Element representing the appropriate docs content or notFound
 */
const DocsPages = async (props: PostPageProps) => {
  // Await params until the actual slug array is available.
  const params = await props.params;
  const slugArray = params.slug;
  const path = slugArray.join("/");

  try {
    // Try to get as document first
    const post = await API.docs.getByPath(path);

    if (post && post.published) {
      // Render a documentation page
      // Fetch all published docs for navigation (can be optimized later)
      const allDocsResult = await API.docs.getAllPublished({
        $page: 1,
        $limit: 1000,
      });

      const allDocs = Array.isArray(allDocsResult)
        ? allDocsResult
        : allDocsResult?.data || allDocsResult?.docs || [];

      return (
        <DocRenderer
          data={post as unknown as IDocPost}
          allDocs={allDocs as IDocPost[]}
        />
      );
    }

    // Try to get as folder
    const folder = await DocFolderService.getFolderByPath(path, false);

    if (folder) {
      // Render a folder/group index page
      return <GroupRender groupPath={path} />;
    }
  } catch (error: any) {
    // Log error details for debugging
    const errorMessage = error?.message || error?.data?.message || "Unknown error";
    const errorStatus = error?.status || error?.response?.status || error?.statusCode;
    
    // Only log if it's not a 404 (which is expected for not found docs/folders)
    if (errorStatus !== 404) {
      console.error("Error fetching doc:", {
        message: errorMessage,
        status: errorStatus,
        path,
        error: error instanceof Error ? error : String(error),
      });
    }
  }

  // Not found
  return notFound();
};

export default DocsPages;
