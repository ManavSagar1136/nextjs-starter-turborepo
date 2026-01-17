import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Routes } from "@/data/routes";
import { generateSEOMetadata } from "@/utils/seo";

import { SiteConfig } from "@/config";
import { API } from "@/services";

// Force static generation
export const dynamic = "force-static";

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

    // Generate paths for all documents
    const docParams = posts.map((post: any) => {
      const slug = post.slug || post.path || post.id;
      const slugArray = typeof slug === "string" ? slug.split("/") : slug;
      return {
        slug: slugArray,
      };
    });

    // Generate paths for all folders
    const folderParams = folders.map((folder: any) => {
      const path = folder.path || folder.slug || folder.id;
      const slugArray = typeof path === "string" ? path.split("/") : path;
      return {
        slug: slugArray,
      };
    });

    // Combine both docs and folders
    return [...docParams, ...folderParams];
  } catch (error) {
    console.error("Error generating static params for docs:", error);
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
    const folders = await API.docs.getFolders({ tree: true });
    const allFolders = Array.isArray(folders) ? folders : [];
    const folder = allFolders.find(
      (f: any) => f.path === path || f.slug === path
    );

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
  } catch (error) {
    console.error("Error generating metadata:", error);
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

      // TODO: Replace with actual DocRenderer component when available
      return (
        <div className="container mx-auto py-8 max-w-4xl">
          <article>
            <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
            {post.subtitle && (
              <p className="text-xl text-muted-foreground mb-2">
                {post.subtitle}
              </p>
            )}
            {post.description && (
              <p className="text-lg text-muted-foreground mb-6">
                {post.description}
              </p>
            )}
            <div className="prose prose-lg dark:prose-invert max-w-none">
              {/* TODO: Replace with MarkdownView component when available */}
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>
          </article>

          {allDocs.length > 0 && (
            <div className="mt-12 border-t pt-8">
              <h2 className="text-2xl font-bold mb-4">More Documentation</h2>
              <div className="grid gap-4">
                {allDocs
                  .filter((doc: any) => doc.id !== post.id)
                  .slice(0, 6)
                  .map((doc: any) => (
                    <a
                      key={doc.id}
                      href={`${Routes.docs}/${doc.slug}`}
                      className="border rounded-lg p-4 hover:bg-accent transition-colors"
                    >
                      <h3 className="font-semibold mb-2">{doc.title}</h3>
                      {doc.description && (
                        <p className="text-sm text-muted-foreground">
                          {doc.description}
                        </p>
                      )}
                    </a>
                  ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Try to get as folder
    const folders = await API.docs.getFolders({ tree: true });
    const allFolders = Array.isArray(folders) ? folders : [];
    const folder = allFolders.find(
      (f: any) => f.path === path || f.slug === path
    );

    if (folder) {
      // Render a folder/group index page
      // TODO: Replace with actual GroupRender component when available
      const folderDocsResult = await API.docs.getAllPublished({
        $page: 1,
        $limit: 1000,
        folderId: folder.id,
      });

      const folderDocs = Array.isArray(folderDocsResult)
        ? folderDocsResult
        : folderDocsResult?.data || folderDocsResult?.docs || [];

      return (
        <div className="container mx-auto py-8">
          <h1 className="text-4xl font-bold mb-4">{folder.name}</h1>
          <div className="grid gap-4">
            {folderDocs.length === 0 ? (
              <p className="text-muted-foreground">
                No documentation in this category.
              </p>
            ) : (
              folderDocs.map((doc: any) => (
                <a
                  key={doc.id}
                  href={`${Routes.docs}/${doc.slug}`}
                  className="border rounded-lg p-6 hover:bg-accent transition-colors"
                >
                  <h2 className="text-xl font-semibold mb-2">{doc.title}</h2>
                  {doc.description && (
                    <p className="text-muted-foreground">{doc.description}</p>
                  )}
                </a>
              ))
            )}
          </div>
        </div>
      );
    }
  } catch (error) {
    console.error("Error fetching doc:", error);
  }

  // Not found
  return notFound();
};

export default DocsPages;
