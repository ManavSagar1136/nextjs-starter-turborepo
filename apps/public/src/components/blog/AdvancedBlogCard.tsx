import React from "react";
import Link from "next/link";
import { Routes } from "@/data/routes";
import { shareContent } from "@/utils/browser";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  Layers,
  Share2,
} from "lucide-react";

import { IBlogPost, IBlogTag } from "@/services/blogs";

import { BlogAuthor } from "./BlogAuthor";
import { Badge } from "@buildbase/ui/components/ui/badge";
import { Button } from "@buildbase/ui/components/ui/button";
import { Card, CardContent } from "@buildbase/ui/components/ui/card";
import { LazyImage } from "@buildbase/ui/components/ui/lazy-image";

import { getBlogTags } from "@/lib/blogs/blog-adapter";
import { computeFolderUrl, computePostUrl } from "@/lib/blogs/blog-url.service";
import { cn } from "@buildbase/ui/lib/utils";

import { TOC_ATTRIBUTES } from "../content/TableOfContents";
import { BLOG_VIEW_MODE, type IBlogViewMode } from "./constants";

const MAX_TAGS_DISPLAY = 2;

interface AdvancedBlogCardProps {
  data: IBlogPost;
  featured?: boolean;
  className?: string;
  allTags: IBlogTag[];
  hideGroups?: boolean;
  viewMode?: IBlogViewMode;
}

export function AdvancedBlogCard({
  data,
  featured = false,
  className,
  allTags,
  hideGroups = false,
  viewMode = BLOG_VIEW_MODE.GRID,
}: AdvancedBlogCardProps) {
  const readingTime = Math.ceil((data.content?.split(" ").length || 0) / 200);

  const blogTags: IBlogTag[] = getBlogTags(data, allTags);

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const postUrl = data.url || computePostUrl(data);
    shareContent({
      title: data.title,
      text: data.excerpt || data.description || "",
      url: typeof window !== "undefined" ? `${window.location.origin}${postUrl}` : postUrl,
    });
  };

  // List view - compact horizontal layout
  if (viewMode === BLOG_VIEW_MODE.LIST) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "group border rounded-lg border-border dark:border-border hover:bg-muted/30 transition-colors duration-200 bg-card dark:bg-card",
          className,
        )}
      >
        <Link href={data.url || computePostUrl(data)} aria-label={`Read blog post: ${data.title}`}>
          <Card className="relative overflow-hidden transition-all duration-200 rounded-none shadow-none border-none bg-transparent dark:bg-transparent">
            <div className="@container flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4">
              {/* Thumbnail - Small and on the left */}
              <div className="flex-shrink-0 size-full sm:size-20 h-auto aspect-video sm:aspect-square rounded-md overflow-hidden bg-muted">
                <LazyImage
                  src={data.image || ""}
                  alt={data.title}
                  className="w-full h-full object-cover transition-opacity duration-200 group-hover:opacity-90 sm:aspect-square"
                  hideSkeleton={false}
                />
              </div>

              {/* Content - Flexible */}
              <div className="flex-1 min-w-0 flex flex-col gap-1.5 sm:gap-2">
                {/* Title - 1-2 lines */}
                <h3
                  {...{ [TOC_ATTRIBUTES.EXCLUDE]: "true" }}
                  className="text-sm sm:text-base @sm:text-lg font-semibold line-clamp-1 text-foreground dark:text-foreground group-hover:text-primary dark:group-hover:text-primary transition-colors"
                >
                  {data.title}
                </h3>

                {/* Description - 1 line (excerpt prioritized for short UI) */}
                {(data.excerpt || data.description) && (
                  <p className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground line-clamp-2">
                    {data.excerpt || data.description}
                  </p>
                )}

                {/* Consolidated metadata and tags in single row */}
                <div className="flex flex-wrap items-center gap-2 mt-auto sm:gap-3 text-[10px] sm:text-xs text-muted-foreground dark:text-muted-foreground">
                  {/* Date */}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span className="whitespace-nowrap">
                      {format(new Date(data.publishedAt || ""), "MMM d, yyyy")}
                    </span>
                  </div>

                  {/* Reading time */}
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 flex-shrink-0" />
                    <span className="whitespace-nowrap">{readingTime} min</span>
                  </div>

                  {/* Author */}
                  <BlogAuthor
                    authors={data.authors}
                    variant="compact"
                    avatarSize="sm"
                    showLabel={false}
                  />

                  {/* Tags - Max 1 with +N */}
                  {blogTags && blogTags.length > 0 && (
                    <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
                      {blogTags.slice(0, 1).map((tag) => (
                        <Link
                          key={tag.slug}
                          href={tag.url || `${Routes.blogTags}/${tag.slug}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0.5 h-5 border-border dark:border-border text-muted-foreground dark:text-muted-foreground hover:bg-muted transition-colors whitespace-nowrap"
                          >
                            {tag.title}
                          </Badge>
                        </Link>
                      ))}
                      {blogTags.length > 1 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0.5 h-5 border-border dark:border-border text-muted-foreground dark:text-muted-foreground whitespace-nowrap"
                        >
                          +{blogTags.length - 1}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Read More Arrow - Subtle */}
              <div className="hidden sm:flex flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
              </div>
            </div>
          </Card>
        </Link>
      </motion.div>
    );
  }

  // Grid view - existing layout
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "group border border-border dark:border-border hover:shadow-2xl hover:-translate-y-2 rounded-lg overflow-hidden bg-card dark:bg-card",
        featured && "border-primary dark:border-primary",
        className,
      )}
    >
      <Link
        href={data.url || computePostUrl(data)}
        aria-label={`Read blog post: ${data.title}`}
        className="block h-full"
      >
        <Card
          className={cn(
            "relative overflow-hidden transition-all duration-300 rounded-none shadow-none border-none bg-card dark:bg-card h-full flex flex-col",
          )}
        >
          {/* Featured Badge */}
          {featured && (
            <div className="absolute top-4 left-4 z-10">
              <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
                Featured
              </Badge>
            </div>
          )}

          {/* Image Container */}
          <div className="relative overflow-hidden aspect-[16/9]">
            <LazyImage
              src={data.image || ""}
              alt={data.title}
              className={cn(
                "aspect-[16/9] transition-transform duration-500 group-hover:scale-110",
              )}
              hideSkeleton={false}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 dark:from-black/80 via-transparent to-transparent" />

            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 dark:bg-primary/50"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 text-muted-foreground dark:text-black" />
              </Button>
            </div>
          </div>

          <CardContent className="p-4 bg-card dark:bg-card flex flex-col flex-1 space-y-4">
            {/* Folder */}
            {!hideGroups && data.folder && (
              <div
                className="flex flex-wrap gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <Link href={computeFolderUrl(data.folder)}>
                  <Badge
                    variant="outline"
                    className="text-xs px-2 py-1 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Layers className="h-3 w-3" />
                    {data.folder.name}
                  </Badge>
                </Link>
              </div>
            )}

            {/* Tags */}
            {blogTags && blogTags.length > 0 && (
              <div
                className="flex flex-wrap gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                {blogTags.slice(0, MAX_TAGS_DISPLAY).map((tag) => (
                  <Link key={tag.slug} href={tag.url || `${Routes.blogTags}/${tag.slug}`}>
                    <Badge
                      variant="secondary"
                      className="text-xs px-2 py-1 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors"
                    >
                      {tag.title}
                    </Badge>
                  </Link>
                ))}
                {blogTags.length > MAX_TAGS_DISPLAY && (
                  <Badge
                    variant="outline"
                    className="text-xs px-2 py-1 border-border dark:border-border text-foreground dark:text-foreground"
                  >
                    +{blogTags.length - MAX_TAGS_DISPLAY}
                  </Badge>
                )}
              </div>
            )}

            {/* Title */}
            <h3
              {...{ [TOC_ATTRIBUTES.EXCLUDE]: "true" }}
              className="text-lg font-bold line-clamp-2 text-foreground dark:text-foreground group-hover:text-primary dark:group-hover:text-primary transition-colors"
            >
              {data.title}
            </h3>

            {/* Description (excerpt prioritized for short UI) */}
            {(data.excerpt || data.description) && (
              <p className="text-muted-foreground dark:text-muted-foreground text-sm line-clamp-3">
                {data.excerpt || data.description}
              </p>
            )}

            {/* Meta Information */}
            <div className="flex items-center justify-between text-xs text-muted-foreground dark:text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {format(new Date(data.publishedAt || ""), "MMM d, yyyy")}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{readingTime} min read</span>
                </div>
              </div>
            </div>

            {/* Authors */}
            <BlogAuthor
              authors={data.authors}
              variant="full"
              avatarSize="md"
              showLabel={false}
              showByPrefix={true}
              maxAuthors={1}
              className="*:gap-1"
            />

            {/* Read More Button */}
            <div className="flex items-end justify-between flex-1">
              <Button
                variant="ghost"
                size="sm"
                className="group-hover:text-primary dark:group-hover:text-primary transition-colors p-0 h-auto text-foreground dark:text-foreground"
              >
                Read More
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>

              <div className="flex items-center gap-1 text-xs text-muted-foreground dark:text-muted-foreground">
                <BookOpen className="h-3 w-3" />
                <span>{readingTime} min</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
