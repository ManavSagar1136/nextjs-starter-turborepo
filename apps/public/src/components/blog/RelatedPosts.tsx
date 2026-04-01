import { ArrowRight, BookOpen } from "lucide-react";

import { IBlogPost, IBlogTag } from "@/services/blogs";

import { Button } from "@buildbase/ui/components/ui/button";
import { MotionWrapper } from "@buildbase/ui/components/ui/motion-wrapper";

import { cn } from "@buildbase/ui/lib/utils";

import { TOC_ATTRIBUTES } from "../content/TableOfContents";
import { AdvancedBlogCard } from "./AdvancedBlogCard";

interface RelatedPostsProps {
  posts: IBlogPost[];
  currentPostSlug: string;
  className?: string;
  allTags: IBlogTag[];
}

export function RelatedPosts({
  posts,
  currentPostSlug,
  className,
  allTags,
}: RelatedPostsProps) {
  // Filter out the current post and limit to 3 related posts
  const relatedPosts = posts
    .filter((post) => post.slug !== currentPostSlug)
    .slice(0, 3);

  if (relatedPosts.length === 0) {
    return null;
  }

  return (
    <MotionWrapper
      as="section"
      preset="slideUp"
      duration={0.5}
      className={cn(
        "py-10 md:py-20 bg-gradient-to-br from-slate-100/20 dark:from-dark-surface-elevated/20 to-white dark:to-dark-surface",
        className,
      )}
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <MotionWrapper
          preset="slideUp"
          delay={0.2}
          className="text-center mb-12"
        >
          <>
            <div className="flex items-center justify-center gap-2 mb-4">
              <BookOpen className="h-6 w-6 text-indigo-500" />
              <h2
                className="text-3xl font-bold"
                {...{ [TOC_ATTRIBUTES.EXCLUDE]: "true" }}
              >
                Related Articles
              </h2>
            </div>
            <p className="text-slate-400 dark:text-slate-600 text-lg max-w-2xl mx-auto">
              Discover more insights and tutorials that might interest you
            </p>
          </>
        </MotionWrapper>

        {/* Related Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {relatedPosts.map((post, index) => (
            <MotionWrapper
              key={post.id}
              preset="slideUp"
              delay={0.3 + index * 0.1}
            >
              <AdvancedBlogCard
                data={post}
                featured={index === 0} // Mark first post as featured
                allTags={allTags}
              />
            </MotionWrapper>
          ))}
        </div>

        {/* View All Posts Button */}
        <MotionWrapper preset="slideUp" delay={0.6} className="text-center">
          <Button
            size="lg"
            className="gap-2 hover:bg-indigo-500/90 transition-colors"
          >
            View All Posts
            <ArrowRight />
          </Button>
        </MotionWrapper>
      </div>
    </MotionWrapper>
  );
}
