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

import TagBlogsList from "@/components/blog/TagBlogsList";
import BlogsError from "@/components/blog/BlogsError";
import CustomButton from "@/components/ui/custom-button";
import HeroBgWrapper from "@/components/hero-bg-wrapper";

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
      return (
        <div className="flex flex-col">
          <HeroBgWrapper classNames="">
            <div className="text-[30px] md:text-[56px] font-bold">{"Tags"}</div>
          </HeroBgWrapper>
          <div className="flex flex-col justify-center items-center container mx-auto p-5 md:p-10 rounded-[10px] py-5 md:py-10">
            <BlogsError subTitle="There's no content available under this tag right now. Please check back later or explore other tags and topics that might interest you." />
            <CustomButton
              link={true}
              href={Routes.blogTags}
              classNames="px-6 flex justify-center items-center gap-2"
            >
              <MoveLeftIcon />
              {"See All Tags"}
            </CustomButton>
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
      : postsResult?.data || [];

    const posts = postsData.map((post: any) => adaptBlogPost(post));
    const tagData = adaptTag(tag);

    return <TagBlogsList posts={posts} tagData={tagData} allTags={adaptedAllTags} />;
  } catch (error) {
    console.error("Error fetching blog posts by tag:", error);
    return (
      <div className="container mx-auto py-8">
        <p className="text-muted-foreground">Error loading posts.</p>
      </div>
    );
  }
}
