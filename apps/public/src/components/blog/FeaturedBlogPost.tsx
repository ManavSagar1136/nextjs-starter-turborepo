import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, Calendar, Clock, Star } from "lucide-react";

import { IBlogPost, IBlogTag } from "@/services/blogs";
import { computePostUrl } from "@/lib/blogs/blog-url.service";

import { BlogAuthor } from "./BlogAuthor";
import { Badge } from "@buildbase/ui/components/ui/badge";
import { Button } from "@buildbase/ui/components/ui/button";
import { Card, CardContent } from "@buildbase/ui/components/ui/card";

import { cn } from "@buildbase/ui/lib/utils";

import { LazyImage } from "../ui/lazy-image";
import { MotionWrapper } from "../ui/motion-wrapper";

interface FeaturedBlogPostProps {
  post: IBlogPost;
  className?: string;
  disableHoverEffect?: boolean;
}

export function FeaturedBlogPost({
  post,
  className,
  disableHoverEffect = false,
}: FeaturedBlogPostProps) {
  const readingTime = Math.ceil((post.content?.split(" ").length || 0) / 200);

  return (
    <MotionWrapper
      preset="slideUp"
      duration={0.6}
      className={cn("group", className)}
    >
      <Card
        className={cn(
          "relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer bg-gradient-to-br from-white dark:from-dark-surface-secondary to-slate-100/20 dark:to-dark-surface-elevated/30",
          disableHoverEffect ? "hover:shadow-none" : "hover:shadow-2xl",
        )}
      >
        {/* Featured Badge */}
        <div className="absolute top-6 left-6 z-10 flex items-center gap-2">
          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white flex items-center gap-1">
            <Star className="h-3 w-3 fill-current" />
            Featured
          </Badge>
        </div>

        <div className="max-lg:flex flex-col overflow-hidden lg:grid lg:grid-cols-2 gap-0 h-full">
          {/* Image Section */}
          <div className="relative overflow-hidden aspect-[4/3] lg:aspect-square">
            <LazyImage
              src={post.image || ""}
              alt={post.title}
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              hideSkeleton={false}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 dark:from-black/90 via-black/20 dark:via-black/40 to-transparent pointer-events-none" />

            {/* Content Overlay */}
            <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
              <div className="space-y-4">
                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.slice(0, 3).map((tag: IBlogTag) => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="bg-white/20 dark:bg-white/10 text-white dark:text-white/90 border-white/30 dark:border-white/20 backdrop-blur-sm"
                      >
                        {tag.title}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Meta Info */}
                <div className="flex items-center gap-4 text-sm text-white/80 dark:text-white/90">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {format(new Date(post.publishedAt || ""), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{readingTime} min read</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <CardContent className="p-6 md:p-8 flex flex-col justify-center bg-slate-50 dark:bg-dark-surface-secondary max-lg:flex-1">
            <div className="space-y-6 flex flex-col max-lg:flex-1">
              {/* Title */}
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight text-slate-900 dark:text-slate-50 group-hover:text-indigo-500 dark:group-hover:text-indigo-500 transition-colors line-clamp-2">
                {post.title}
              </h2>

              {/* Description (excerpt prioritized for short UI) */}
              {(post.excerpt || post.description) && (
                <p className="text-slate-400 dark:text-slate-600 text-lg leading-relaxed line-clamp-3">
                  {post.excerpt || post.description}
                </p>
              )}

              {/* Authors */}
              <BlogAuthor
                authors={post.authors}
                variant="compact"
                avatarSize="lg"
                showLabel={true}
              />
              {/* Read More Button */}
              <div className="flex items-end justify-between pt-4 flex-wrap gap-2 max-lg:flex-1">
                <Link href={post.url || computePostUrl(post)}>
                  <Button size="lg" className="transition-all duration-300">
                    Read Full Article
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </div>

        {/* Hover Effect Border */}
        <div className="absolute inset-0 border-2 border-indigo-500/20 dark:border-indigo-500/30 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:scale-[1.02] pointer-events-none" />
      </Card>
    </MotionWrapper>
  );
}
