import { Metadata } from "next";
import { Routes } from "@/data/routes";
import { generateSEOMetadata } from "@/utils/seo";
import { MoveLeftIcon } from "lucide-react";

import { SiteConfig } from "@/config";
import {
  adaptBlogPost,
  adaptTag,
  extractSlugPart,
} from "@/lib/blogs/blog-adapter";
import { API } from "@/services";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

// Force static generation
export const dynamic = "force-static";

export async function generateStaticParams() {
  try {
    const tagsResult = await API.blogs.getTags({
      $page: 1,
      $limit: 10000,
    });

    const tags = Array.isArray(tagsResult) ? tagsResult : tagsResult || [];

    return tags.map((tag: any) => {
      // Extract just the slug part (last segment) if it's a full path
      const slugPart = extractSlugPart(tag.slug);
      return { slug: slugPart };
    });
  } catch (error) {
    console.error("Error generating static params for blog tags:", error);
    return [];
  }
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const data = await params;
  const rawSlug = decodeURI(data.slug || "");

  // Extract just the slug part (last segment) if it's a full path
  const slug = extractSlugPart(rawSlug);

  try {
    const tags = await API.blogs.getTags({
      $page: 1,
      $limit: 10000,
    });

    const allTags = Array.isArray(tags) ? tags : tags || [];
    const tag = allTags.find(
      (t: any) => extractSlugPart(t.slug) === slug
    );

    if (!tag || !tag.isPublic) {
      return {};
    }

    // Use the extracted slug part for the URL (not the raw tag.slug which might be a full path)
    const urlSlug = slug;
    return generateSEOMetadata({
      title: tag.title,
      description: `Blog posts tagged with ${tag.title}`,
      url: `${SiteConfig.baseUrl}${Routes.blogTags}/${urlSlug}`,
      type: "website",
    });
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {};
  }
}

export default async function BlogsByTag(props: PostPageProps) {
  const data = await props.params;
  const rawSlug = decodeURI(data.slug || "");

  // Extract just the slug part (last segment) if it's a full path
  // This handles cases where the slug might be "blogs/tags/authentication" instead of just "authentication"
  const slug = extractSlugPart(rawSlug);

  try {
    // Fetch tag and all tags
    const [tagsResult, allTagsResult] = await Promise.all([
      API.blogs.getTags({
        $page: 1,
        $limit: 10000,
      }),
      API.blogs.getTags({
        $page: 1,
        $limit: 10000,
      }),
    ]);

    const allTags = Array.isArray(allTagsResult) ? allTagsResult : allTagsResult || [];
    const tag = allTags.find(
      (t: any) => extractSlugPart(t.slug) === slug
    );

    const adaptedAllTags = allTags.map((t: any) => adaptTag(t));

    if (!tag || !tag.isPublic) {
      // TODO: Replace with actual BlogsError and CustomButton components when available
      return (
        <div className="flex flex-col">
          <div className="text-[30px] md:text-[56px] font-bold mb-8">Tags</div>
          <div className="flex flex-col justify-center items-center container mx-auto p-5 md:p-10 rounded-[10px] py-5 md:py-10">
            <p className="text-muted-foreground mb-4">
              There's no content available under this tag right now. Please
              check back later or explore other tags and topics that might
              interest you.
            </p>
            <a
              href={Routes.blogTags}
              className="text-primary hover:underline inline-flex items-center gap-2 px-6 py-2 border rounded-md"
            >
              <MoveLeftIcon />
              See All Tags
            </a>
          </div>
        </div>
      );
    }

    // Fetch posts with this tag
    const postsResult = await API.blogs.getByTag(slug, {
      $page: 1,
      $limit: 1000,
    });

    const postsData = Array.isArray(postsResult)
      ? postsResult
      : postsResult?.data || postsResult?.docs || [];

    const posts = postsData.map((post: any) => adaptBlogPost(post));
    const tagData = adaptTag(tag);

    // TODO: Replace with actual TagBlogsList component when available
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold mb-2">
          Posts tagged with: {tagData.title}
        </h1>
        <div className="flex flex-wrap gap-2 mb-8">
          {adaptedAllTags.map((t) => (
            <a
              key={t.id}
              href={`${Routes.blogTags}/${extractSlugPart(t.slug)}`}
              className={`px-4 py-2 rounded-md transition-colors ${
                extractSlugPart(t.slug) === slug
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/10 text-primary hover:bg-primary/20"
              }`}
            >
              {t.title}
            </a>
          ))}
        </div>
        <div className="grid gap-6">
          {posts.length === 0 ? (
            <p className="text-muted-foreground">No posts found for this tag.</p>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="border rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-2">{post.title}</h2>
                <p className="text-muted-foreground mb-4">{post.description}</p>
                <a
                  href={post.slug}
                  className="text-primary hover:underline"
                >
                  Read more →
                </a>
              </div>
            ))
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching blog posts by tag:", error);
    return (
      <div className="container mx-auto py-8">
        <p className="text-muted-foreground">Error loading posts.</p>
      </div>
    );
  }
}
