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
import { JsonLd } from "@/components/seo/JsonLd";

// Force static generation
export const dynamic = "force-static";
export const revalidate = 3600;
// Unmatched slugs → 404, not 500
export const dynamicParams = false;

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
  searchParams: Promise<{ page?: string }>;
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
      return generateSEOMetadata({
        title: seoTitle,
        description: post.seoDescription || post.description || "",
        url: `${SiteConfig.baseUrl}${Routes.docs}/${path}`,
        type: "article",
        keywords: post.seoKeywords || [],
        publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
        modifiedTime: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
        section: post.folder?.name,
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
        keywords: [folderName],
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
  const searchParams = await props.searchParams;
  const page = Math.max(1, parseInt(searchParams?.page || "1", 10));
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

      const docUrl = `${SiteConfig.baseUrl}${Routes.docs}/${path}`;
      const techArticleLd = {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        headline: post.seoTitle || post.title,
        description: post.seoDescription || post.description || post.subtitle,
        datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
        dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
        url: docUrl,
        publisher: {
          "@type": "Organization",
          name: SiteConfig.name,
          url: SiteConfig.baseUrl,
        },
        keywords: (post.seoKeywords ?? []).join(", "),
      };
      const docBreadcrumbLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SiteConfig.baseUrl },
          { "@type": "ListItem", position: 2, name: "Docs", item: `${SiteConfig.baseUrl}${Routes.docs}` },
          ...(post.folder ? [{ "@type": "ListItem", position: 3, name: post.folder.name, item: `${SiteConfig.baseUrl}${Routes.docs}/${post.folder.path || post.folder.slug}` }] : []),
          { "@type": "ListItem", position: post.folder ? 4 : 3, name: post.title, item: docUrl },
        ],
      };

      return (
        <>
          <JsonLd data={techArticleLd} />
          <JsonLd data={docBreadcrumbLd} />
          <DocRenderer
            data={post as unknown as IDocPost}
            allDocs={allDocs as IDocPost[]}
          />
        </>
      );
    }

    // Try to get as folder
    const folder = await DocFolderService.getFolderByPath(path, false);

    if (folder) {
      const folderUrl = `${SiteConfig.baseUrl}${Routes.docs}/${path}`;
      const folderLd = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `${folder.name} - Documentation`,
        url: folderUrl,
        publisher: { "@type": "Organization", name: SiteConfig.name, url: SiteConfig.baseUrl },
      };
      const folderBreadcrumbLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SiteConfig.baseUrl },
          { "@type": "ListItem", position: 2, name: "Docs", item: `${SiteConfig.baseUrl}${Routes.docs}` },
          { "@type": "ListItem", position: 3, name: folder.name, item: folderUrl },
        ],
      };
      return (
        <>
          <JsonLd data={folderLd} />
          <JsonLd data={folderBreadcrumbLd} />
          <GroupRender groupPath={path} page={page} />
        </>
      );
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
