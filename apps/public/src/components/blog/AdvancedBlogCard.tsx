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
          "group rounded-xl transition-colors duration-200 bg-slate-50 dark:bg-dark-surface-secondary border border-slate-200 dark:border-slate-800",
          className,
        )}
      >
        <Link href={data.url || computePostUrl(data)} aria-label={`Read blog post: ${data.title}`}>
          <div className="@container flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4">
            {/* Thumbnail - Small and on the left */}
            <div className="flex-shrink-0 size-full sm:size-20 h-auto aspect-video sm:aspect-square rounded-md overflow-hidden bg-slate-100 dark:bg-dark-surface-elevated">
              <LazyImage
                src={data.image || ""}
                alt={data.title}
                className="w-full h-full object-cover transition-opacity duration-200 group-hover:opacity-90 sm:aspect-square"
                hideSkeleton={false}
              />
            </div>

            {/* Content - Flexible */}
            <div className="flex-1 min-w-0 flex flex-col gap-1.5 sm:gap-2">
              {/* Title */}
              <h3
                {...{ [TOC_ATTRIBUTES.EXCLUDE]: "true" }}
                className="text-sm sm:text-base @sm:text-lg font-semibold line-clamp-1 transition-colors group-hover:text-indigo-500 text-slate-900 dark:text-slate-50"
              >
                {data.title}
              </h3>

              {/* Description */}
              {(data.excerpt || data.description) && (
                <p className="text-xs sm:text-sm line-clamp-2 text-slate-600 dark:text-slate-400">
                  {data.excerpt || data.description}
                </p>
              )}

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-2 mt-auto sm:gap-3 text-[10px] sm:text-xs text-slate-400 dark:text-slate-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 flex-shrink-0" />
                  <span className="whitespace-nowrap">
                    {format(new Date(data.publishedAt || ""), "MMM d, yyyy")}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 flex-shrink-0" />
                  <span className="whitespace-nowrap">{readingTime} min</span>
                </div>

                <BlogAuthor
                  authors={data.authors}
                  variant="compact"
                  avatarSize="sm"
                  showLabel={false}
                />

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
                          className="text-[10px] px-1.5 py-0.5 h-5 whitespace-nowrap hover:bg-slate-100 dark:hover:bg-dark-surface-elevated transition-colors border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-600"
                        >
                          {tag.title}
                        </Badge>
                      </Link>
                    ))}
                    {blogTags.length > 1 && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0.5 h-5 whitespace-nowrap border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-600"
                      >
                        +{blogTags.length - 1}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Read More Arrow */}
            <div className="hidden sm:flex flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-600" />
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  // Grid view
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "group mk-card rounded-[20px] overflow-hidden mk-card-static hover:-translate-y-2 hover:shadow-lg",
        featured && "border-indigo-500",
        "bg-slate-50 dark:bg-dark-surface-secondary",
        className,
      )}
    >
      <Link
        href={data.url || computePostUrl(data)}
        aria-label={`Read blog post: ${data.title}`}
        className="block h-full"
      >
        <div className="relative overflow-hidden transition-all duration-300 h-full flex flex-col">
          {/* Featured Badge */}
          {featured && (
            <div className="absolute top-4 left-4 z-10">
              <Badge className="mk-gradient-brand text-white border-0">
                Featured
              </Badge>
            </div>
          )}

          {/* Image Container */}
          <div className="relative overflow-hidden aspect-[16/9]">
            <LazyImage
              src={data.image || ""}
              alt={data.title}
              className="aspect-[16/9] transition-transform duration-500 group-hover:scale-110"
              hideSkeleton={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Share Button */}
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                className="h-8 w-8 flex items-center justify-center rounded-full backdrop-blur-sm transition-colors bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </button>
            </div>
          </div>

          <div className="p-4 flex flex-col flex-1 space-y-4 bg-slate-50 dark:bg-dark-surface-secondary">
            {/* Folder */}
            {!hideGroups && data.folder && (
              <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                <Link href={computeFolderUrl(data.folder)}>
                  <Badge
                    variant="outline"
                    className="text-xs px-2 py-1 transition-colors cursor-pointer flex items-center gap-1.5 bg-indigo-500/[0.08] dark:bg-indigo-500/12 text-indigo-500 border-indigo-500"
                  >
                    <Layers className="h-3 w-3" />
                    {data.folder.name}
                  </Badge>
                </Link>
              </div>
            )}

            {/* Tags */}
            {blogTags && blogTags.length > 0 && (
              <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                {blogTags.slice(0, MAX_TAGS_DISPLAY).map((tag) => (
                  <Link key={tag.slug} href={tag.url || `${Routes.blogTags}/${tag.slug}`}>
                    <Badge
                      variant="secondary"
                      className="text-xs px-2 py-1 transition-colors bg-indigo-500/[0.08] dark:bg-indigo-500/12 text-indigo-500"
                    >
                      {tag.title}
                    </Badge>
                  </Link>
                ))}
                {blogTags.length > MAX_TAGS_DISPLAY && (
                  <Badge
                    variant="outline"
                    className="text-xs px-2 py-1 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  >
                    +{blogTags.length - MAX_TAGS_DISPLAY}
                  </Badge>
                )}
              </div>
            )}

            {/* Title */}
            <h3
              {...{ [TOC_ATTRIBUTES.EXCLUDE]: "true" }}
              className="text-lg font-bold line-clamp-2 transition-colors group-hover:text-indigo-500 text-slate-900 dark:text-slate-50"
            >
              {data.title}
            </h3>

            {/* Description */}
            {(data.excerpt || data.description) && (
              <p className="text-sm line-clamp-3 text-slate-600 dark:text-slate-400">
                {data.excerpt || data.description}
              </p>
            )}

            {/* Meta */}
            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-600">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(data.publishedAt || ""), "MMM d, yyyy")}</span>
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

            {/* Read More */}
            <div className="flex items-end justify-between flex-1">
              <span className="text-sm font-medium transition-colors group-hover:text-indigo-500 text-slate-900 dark:text-slate-50">
                Read More
                <ArrowRight className="ml-2 h-4 w-4 inline group-hover:translate-x-1 transition-transform" />
              </span>

              <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-600">
                <BookOpen className="h-3 w-3" />
                <span>{readingTime} min</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
