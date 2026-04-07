"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Routes } from "@/data/routes";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Grid3X3,
  List,
  Tag as TagIcon,
  TrendingUp,
  X,
} from "lucide-react";

import { IBlogPost, IBlogTag } from "@/services/blogs";

import { Badge } from "@buildbase/ui/components/ui/badge";
import { Button } from "@buildbase/ui/components/ui/button";
import { Card } from "@buildbase/ui/components/ui/card";
import SearchBar from "@buildbase/ui/components/ui/search-bar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@buildbase/ui/components/ui/select";

import { filterBlogPosts } from "@/lib/blogs/blog-utils";
import { cn } from "@buildbase/ui/lib/utils";
import PaginationControls from "@buildbase/ui/components/ui/pagination-controls";

import { AdvancedBlogCard } from "./AdvancedBlogCard";
import { BLOG_VIEW_MODE, type IBlogViewMode } from "./constants";

const ITEMS_PER_PAGE = 12;

interface BlogLayoutProps {
  posts: IBlogPost[];
  className?: string;
  allTags: IBlogTag[];
}

export function BlogLayout({ posts, className, allTags }: BlogLayoutProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<IBlogViewMode>(BLOG_VIEW_MODE.GRID);
  const [sortBy, setSortBy] = useState("latest");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter posts based on search and tags
  const filteredPosts = useMemo(() => {
    return filterBlogPosts(posts, {
      search: searchQuery,
      selectedTags: selectedTags.length > 0 ? selectedTags : undefined,
      allTags,
    });
  }, [posts, searchQuery, selectedTags, allTags]);

  // Sort posts
  const sortedPosts = useMemo(() => {
    const sorted = [...filteredPosts];
    switch (sortBy) {
      case "latest":
        return sorted.sort(
          (a, b) =>
            new Date(b.publishedAt || "").getTime() -
            new Date(a.publishedAt || "").getTime(),
        );
      case "oldest":
        return sorted.sort(
          (a, b) =>
            new Date(a.publishedAt || "").getTime() -
            new Date(b.publishedAt || "").getTime(),
        );
      case "title":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case "reading-time":
        return sorted.sort((a, b) => {
          const aTime = Math.ceil((a.content?.split(" ").length || 0) / 200);
          const bTime = Math.ceil((b.content?.split(" ").length || 0) / 200);
          return bTime - aTime;
        });
      default:
        return sorted;
    }
  }, [filteredPosts, sortBy]);

  // Reset to page 1 whenever filters/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTags, sortBy]);

  const totalPages = Math.ceil(sortedPosts.length / ITEMS_PER_PAGE);
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedPosts.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedPosts, currentPage]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTags([]);
    setSortBy("latest");
  };

  return (
    <div
      className={cn(
        "min-h-screen bg-white dark:bg-dark-surface",
        className,
      )}
    >
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[20px] py-20 bg-slate-50 dark:bg-dark-surface-secondary"
      >
        <div
          className="absolute inset-0 mk-gradient-hero"
          aria-hidden="true"
        />
        <div className="relative container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <span className="mk-eyebrow mb-4 block">Blog</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-extrabold leading-tight mb-6 text-3xl md:text-4xl text-slate-900 dark:text-slate-50"
          >
            Our <span className="mk-gradient-text">Blog</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-2xl mx-auto mb-8 leading-relaxed text-lg text-slate-600 dark:text-slate-400"
          >
            Discover insights, tutorials, and the latest updates from our team
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-md mx-auto"
          >
            <SearchBar
              placeholder="Search articles..."
              externalQuery={searchQuery}
              setExternalQuery={setSearchQuery}
              disableUrlStorage={true}
              className="backdrop-blur-sm bg-slate-100 dark:bg-dark-surface-elevated border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-50"
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Controls Section */}
      <div className="py-10">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full lg:w-80 space-y-6"
          >
            {/* View Toggle */}
            <Card className="p-4 bg-slate-50 dark:bg-dark-surface-secondary border-slate-200 dark:border-slate-800">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-slate-900 dark:text-slate-50">
                <Grid3X3 className="h-4 w-4" />
                View Mode
              </h3>
              <div className="flex gap-2">
                <Button
                  variant={
                    viewMode === BLOG_VIEW_MODE.GRID ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setViewMode(BLOG_VIEW_MODE.GRID)}
                  className="flex-1"
                >
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Grid
                </Button>
                <Button
                  variant={
                    viewMode === BLOG_VIEW_MODE.LIST ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setViewMode(BLOG_VIEW_MODE.LIST)}
                  className="flex-1"
                >
                  <List className="h-4 w-4 mr-2" />
                  List
                </Button>
              </div>
            </Card>

            {/* Sort Options */}
            <Card className="p-4 bg-slate-50 dark:bg-dark-surface-secondary border-slate-200 dark:border-slate-800">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-slate-900 dark:text-slate-50">
                <TrendingUp className="h-4 w-4" />
                Sort By
              </h3>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="title">Title A-Z</SelectItem>
                  <SelectItem value="reading-time">Reading Time</SelectItem>
                </SelectContent>
              </Select>
            </Card>

            {/* Tags Filter */}
            <Card className="p-4 bg-slate-50 dark:bg-dark-surface-secondary border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center justify-between gap-4 w-full">
                  <h3 className="font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-50">
                    <TagIcon className="h-4 w-4" />
                    Tags
                  </h3>
                  <Link href={Routes.blogTags} aria-label="View all tags">
                    <Button variant="ghost" size="sm">
                      View all tags
                    </Button>
                  </Link>
                </div>
                {selectedTags.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-xs"
                  >
                    Clear
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={
                      selectedTags.includes(tag.slug) ? "default" : "outline"
                    }
                    className={cn(
                      "cursor-pointer transition-all",
                      selectedTags.includes(tag.slug)
                        ? "bg-indigo-500 text-white border-indigo-500"
                        : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400",
                    )}
                    onClick={() => handleTagToggle(tag.slug)}
                  >
                    {tag.title}
                  </Badge>
                ))}
              </div>
            </Card>

            {/* Stats */}
            <Card className="p-4 bg-slate-50 dark:bg-dark-surface-secondary border-slate-200 dark:border-slate-800">
              <h3 className="font-semibold mb-3 text-slate-900 dark:text-slate-50">Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400 dark:text-slate-600">Total Posts</span>
                  <span className="font-medium text-slate-900 dark:text-slate-50">{posts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 dark:text-slate-600">Showing</span>
                  <span className="font-medium text-slate-900 dark:text-slate-50">{sortedPosts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 dark:text-slate-600">Tags</span>
                  <span className="font-medium text-slate-900 dark:text-slate-50">{allTags.length}</span>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="scroll-parent w-full"
          >
            {/* Active Filters */}
            {(searchQuery || selectedTags.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex flex-wrap gap-2"
              >
                {searchQuery && (
                  <Badge variant="secondary" className="gap-2">
                    Search: &quot;{searchQuery}&quot;
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setSearchQuery("")}
                    />
                  </Badge>
                )}
                {selectedTags.map((tagSlug) => {
                  const tag = allTags.find((t) => t.slug === tagSlug);
                  return (
                    <Badge key={tagSlug} variant="secondary" className="gap-2">
                      {tag?.title || tagSlug}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleTagToggle(tagSlug)}
                      />
                    </Badge>
                  );
                })}
              </motion.div>
            )}

            {/* Posts Grid/List */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${viewMode}-${sortBy}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  viewMode === BLOG_VIEW_MODE.GRID
                    ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
                    : "flex flex-col gap-6 w-full",
                )}
              >
                {paginatedPosts.map((post, index) => (
                  <AdvancedBlogCard
                    key={post.id}
                    data={post}
                    featured={index < 2 && currentPage === 1 && viewMode === BLOG_VIEW_MODE.GRID}
                    allTags={allTags}
                    viewMode={viewMode}
                  />
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  scrollToTop={true}
                  maxVisible={5}
                />
              </div>
            )}

            {/* No Results */}
            {sortedPosts.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-slate-400 dark:text-slate-600" />
                <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-50">No posts found</h3>
                <p className="mb-4 text-slate-600 dark:text-slate-400">
                  Try adjusting your search or filter criteria
                </p>
                <Button onClick={clearFilters} variant="outline">
                  Clear all filters
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
