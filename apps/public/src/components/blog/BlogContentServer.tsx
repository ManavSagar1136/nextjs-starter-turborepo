import Link from "next/link";
import { Routes } from "@/data/routes";
import { format } from "date-fns";
import { BookOpen, Calendar, Clock } from "lucide-react";

import { IBlogPost, IBlogTag } from "@/services/blogs";

import { BlogAuthor } from "./BlogAuthor";
import { Badge } from "@buildbase/ui/components/ui/badge";
import { MotionWrapper } from "@buildbase/ui/components/ui/motion-wrapper";

import { getBlogTags } from "@/lib/blogs/blog-adapter";
import { cn } from "@buildbase/ui/lib/utils";

import { TOC_ATTRIBUTES } from "../content/TableOfContents";
import MDXImage from "../mdx/MDXImage";
import { ShareBlogButton } from "./BlogButtons";

interface BlogContentServerProps {
  post: IBlogPost;
  className?: string;
  allTags: IBlogTag[];
}

/**
 * Server component for rendering blog content.
 * This component can be used in server components or passed as children to client components.
 */
export function BlogContentServer({
  post,
  className,
  allTags,
}: BlogContentServerProps) {
  const readingTime = Math.ceil(post.content.split(" ").length / 200);
  const blogTags = getBlogTags(post, allTags);
  return (
    <div
      className={cn("w-full space-y-6 md:space-y-10 lg:space-y-16", className)}
    >
      {/* Hero Section */}
      <div
        className="relative overflow-hidden py-8 md:py-10 lg:py-16 rounded-[var(--mk-radius-lg)]"
        style={{ background: "var(--mk-bg-secondary)" }}
      >
        <div
          className="absolute inset-0"
          style={{ background: "var(--mk-gradient-hero)" }}
          aria-hidden="true"
        />
        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            {/* Title */}
            <MotionWrapper
              as="h1"
              preset="slideUp"
              delay={0.3}
              className="text-2xl md:text-3xl lg:text-5xl font-bold scroll-m-40"
              elementProps={{ [TOC_ATTRIBUTES.EXCLUDE]: "true" }}
              style={{ color: "var(--mk-text-primary)" }}
            >
              {post.title}
            </MotionWrapper>

            {/* Description */}
            {(post.description || post.excerpt) && (
              <MotionWrapper
                as="p"
                preset="slideUp"
                delay={0.4}
                className="text-base md:text-lg lg:text-xl max-w-3xl mx-auto"
                style={{ color: "var(--mk-text-secondary)" }}
              >
                {post.description || post.excerpt}
              </MotionWrapper>
            )}

            {/* Meta Information */}
            <MotionWrapper
              preset="slideUp"
              delay={0.5}
              className="flex flex-wrap items-center justify-center gap-6 text-sm"
              style={{ color: "var(--mk-text-muted)" }}
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(post.publishedAt || ""), "MMMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{readingTime} min read</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>Blog Post</span>
              </div>
            </MotionWrapper>

            {/* Authors */}
            {post.authors && post.authors.length > 0 && (
              <MotionWrapper preset="slideUp" delay={0.6}>
                <BlogAuthor
                  authors={post.authors}
                  variant="full"
                  avatarSize="lg"
                  showLabel={true}
                  align="center"
                />
              </MotionWrapper>
            )}

            {/* Tags */}
            {blogTags && blogTags.length > 0 && (
              <MotionWrapper
                preset="slideUp"
                delay={0.7}
                className="flex flex-wrap justify-center gap-2"
              >
                {blogTags.map((tag) => (
                  <Link
                    key={tag.slug}
                    href={tag.url || `${Routes.blogTags}/${tag.slug}`}
                    className="focus:outline-none"
                  >
                    <Badge
                      variant="secondary"
                      className="transition-colors cursor-pointer"
                      style={{ background: "var(--mk-brand-muted)", color: "var(--mk-brand)" }}
                    >
                      {tag.title}
                    </Badge>
                  </Link>
                ))}
              </MotionWrapper>
            )}

            {/* Share Button */}
            <MotionWrapper preset="slideUp" delay={0.8}>
              <ShareBlogButton
                title={post.title}
                description={post.description}
                excerpt={post.excerpt || undefined}
              />
            </MotionWrapper>
          </div>
        </div>
      </div>

      {/* Featured Image */}
      {post.image && (
        <MotionWrapper preset="slideUp" delay={0.9}>
          <div className="max-w-4xl mx-auto">
            <MDXImage
              src={post.image}
              alt={post.title}
              className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
              width="100%"
              height="100%"
            />
          </div>
        </MotionWrapper>
      )}

      {/* Content Section - Markdown is rendered separately to avoid async issues */}
    </div>
  );
}
