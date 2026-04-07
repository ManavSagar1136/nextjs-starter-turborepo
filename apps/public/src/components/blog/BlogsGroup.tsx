"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Folder, X } from "lucide-react";

import { IBlogFolder, IBlogPost, IBlogTag } from "@/services/blogs";
import { Routes } from "@/data/routes";

import { Badge } from "@buildbase/ui/components/ui/badge";
import { Button } from "@buildbase/ui/components/ui/button";
import PaginationControls from "@buildbase/ui/components/ui/pagination-controls";
import SearchBar from "@buildbase/ui/components/ui/search-bar";

import { filterBlogPosts, formatGroupName } from "@/lib/blogs/blog-utils";
import { cn } from "@buildbase/ui/lib/utils";

import HeroBgWrapper from "../hero-bg-wrapper";
import { AppBreadcrumb } from "../ui/app-breadcrumb";
import { AdvancedBlogCard } from "./AdvancedBlogCard";
import TagsFilter from "./TagsFilter";

interface BlogsGroupProps {
  blogs: IBlogPost[];
  allTags: IBlogTag[];
  className?: string;
  groupName?: string;
  /** Display name for the folder (used in the hero) */
  folderName?: string;
  /** Immediate sub-folders of the current folder */
  subFolders?: IBlogFolder[];
}

const ITEMS_PER_PAGE = 12;
const MAX_TAGS_TO_SHOW = 14;

// Search params keys for easy editing
const SEARCH_PARAMS = {
  SEARCH: "search",
  TAGS: "tags",
  PAGE: "page",
} as const;

const getGroupConfig = ({ groupName }: { groupName?: string }) => {
  const formattedName = groupName ? formatGroupName(groupName) : "Blogs";
  return {
    title: `${formattedName} - Blogs`,
    description: `Explore blog posts about ${formattedName.toLowerCase()}. Comprehensive articles and tutorials to help you master the topic.`,
  };
};

const BlogsGroup = ({
  blogs,
  allTags,
  className,
  groupName,
  folderName,
  subFolders = [],
}: BlogsGroupProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const groupConfig = useMemo(
    () => getGroupConfig({ groupName: folderName ?? groupName }),
    [groupName, folderName],
  );

  // Extract all search params in a const
  const searchParamsValues = useMemo(
    () => ({
      search: searchParams.get(SEARCH_PARAMS.SEARCH) || "",
      tags: searchParams.get(SEARCH_PARAMS.TAGS) || "",
      page: parseInt(searchParams.get(SEARCH_PARAMS.PAGE) || "1", 10),
    }),
    [searchParams],
  );

  // Derive selected tags from URL search params
  const selectedTags = useMemo(
    () =>
      searchParamsValues.tags
        ? searchParamsValues.tags.split(",").filter(Boolean)
        : [],
    [searchParamsValues.tags],
  );

  // Update URL search params
  // Note: Search param is handled by SearchBar component
  const updateSearchParams = useCallback(
    (updates: { tags?: string[]; page?: number }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (updates.tags !== undefined) {
        if (updates.tags.length > 0) {
          params.set(SEARCH_PARAMS.TAGS, updates.tags.join(","));
        } else {
          params.delete(SEARCH_PARAMS.TAGS);
        }
      }

      if (updates.page !== undefined) {
        if (updates.page > 1) {
          params.set(SEARCH_PARAMS.PAGE, updates.page.toString());
        } else {
          params.delete(SEARCH_PARAMS.PAGE);
        }
      }

      router.push(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router],
  );

  // Filter blogs based on search and tags
  const filteredBlogs = useMemo(
    () =>
      filterBlogPosts(blogs, {
        search: searchParamsValues.search,
        selectedTags: selectedTags.length > 0 ? selectedTags : undefined,
        allTags,
      }),
    [blogs, searchParamsValues.search, selectedTags, allTags],
  );

  // Paginate filtered blogs
  const totalPages = Math.ceil(filteredBlogs.length / ITEMS_PER_PAGE);
  const paginatedBlogs = useMemo(() => {
    const startIndex = (searchParamsValues.page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredBlogs.slice(startIndex, endIndex);
  }, [filteredBlogs, searchParamsValues.page]);

  const handleTagToggle = useCallback(
    (tagSlug: string) => {
      const newTags = selectedTags.includes(tagSlug)
        ? selectedTags.filter((t) => t !== tagSlug)
        : [...selectedTags, tagSlug];
      updateSearchParams({ tags: newTags, page: 1 });
    },
    [selectedTags, updateSearchParams],
  );

  const clearFilters = useCallback(() => {
    // SearchBar will handle clearing search param via URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete(SEARCH_PARAMS.SEARCH);
    params.delete(SEARCH_PARAMS.TAGS);
    params.delete(SEARCH_PARAMS.PAGE);
    router.push(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const handlePageChange = useCallback(
    (page: number) => {
      updateSearchParams({ page });
    },
    [updateSearchParams],
  );

  return (
    <div className={cn("min-h-screen space-y-6", className)}>
      <HeroBgWrapper classNames="py-4 md:py-5 space-y-1">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-center px-4">
          {groupConfig.title}
        </h1>
        <p className="text-sm lg:text-base text-center px-4 max-w-2xl line-clamp-2">
          {groupConfig.description}
        </p>
      </HeroBgWrapper>
      <AppBreadcrumb />

      {/* Sub-folders */}
      {subFolders.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Folders
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {subFolders.map((folder) => (
              <Link
                key={folder.id}
                href={Routes.blogGroup(folder.path ?? folder.slug)}
                className="group flex items-center gap-2.5 rounded-lg border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Folder className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-accent-foreground" />
                <span className="truncate">{folder.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters Section */}
      <div className="space-y-3">
        {/* Search Bar and Active Filters Row */}
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
          <div className="flex-1 max-w-md w-full">
            <SearchBar
              queryKey={SEARCH_PARAMS.SEARCH}
              placeholder="Search blogs..."
              onValueChangeSetParams={{ page: "1" }}
            />
          </div>
          {/* Active Filters */}
          {(searchParamsValues.search || selectedTags.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap gap-2 flex-1"
            >
              {searchParamsValues.search && (
                <Badge variant="secondary" className="gap-1.5 text-xs py-1">
                  Search: &quot;{searchParamsValues.search}&quot;
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => {
                      const params = new URLSearchParams(
                        searchParams.toString(),
                      );
                      params.delete(SEARCH_PARAMS.SEARCH);
                      params.delete(SEARCH_PARAMS.PAGE);
                      router.push(`?${params.toString()}`, { scroll: false });
                    }}
                  />
                </Badge>
              )}
              <>
                {selectedTags.slice(0, MAX_TAGS_TO_SHOW).map((tagSlug) => {
                  const tag = allTags.find((t) => t.slug === tagSlug);
                  return (
                    <Badge
                      key={tagSlug}
                      variant="secondary"
                      className="gap-1.5 text-xs py-1"
                    >
                      {tag?.title || tagSlug}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleTagToggle(tagSlug)}
                      />
                    </Badge>
                  );
                })}
                {selectedTags.length - MAX_TAGS_TO_SHOW > 0 && (
                  <Badge variant="secondary" className="gap-1.5 text-xs py-1">
                    + {selectedTags.length - MAX_TAGS_TO_SHOW} more
                  </Badge>
                )}
              </>
            </motion.div>
          )}
        </div>

        {/* Tags Filter */}
        <TagsFilter
          allTags={allTags}
          selectedTags={selectedTags}
          onTagToggle={handleTagToggle}
          onClearFilters={clearFilters}
          hasActiveFilters={
            !!(searchParamsValues.search || selectedTags.length > 0)
          }
        />
      </div>

      {/* Results Count */}
      <div className="text-xs sm:text-sm text-slate-400 dark:text-slate-600">
        Showing{" "}
        {paginatedBlogs.length > 0
          ? (searchParamsValues.page - 1) * ITEMS_PER_PAGE + 1
          : 0}{" "}
        to{" "}
        {Math.min(
          searchParamsValues.page * ITEMS_PER_PAGE,
          filteredBlogs.length,
        )}{" "}
        of {filteredBlogs.length} blog{filteredBlogs.length !== 1 ? "s" : ""}
      </div>

      {/* Blogs Grid */}
      <AnimatePresence mode="wait">
        {paginatedBlogs.length > 0 ? (
          <motion.div
            key={`${searchParamsValues.page}-${searchParamsValues.search}-${selectedTags.join(",")}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {paginatedBlogs.map((blog) => (
              <AdvancedBlogCard
                hideGroups
                key={blog.id}
                data={blog}
                allTags={allTags}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <BookOpen className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No blogs found</h3>
            <p className="text-slate-400 dark:text-slate-600 mb-4">
              Try adjusting your search or filter criteria
            </p>
            <Button onClick={clearFilters} variant="outline">
              Clear all filters
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      <PaginationControls
        currentPage={searchParamsValues.page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        scrollToTop={true}
        maxVisible={5}
      />
    </div>
  );
};

export default BlogsGroup;
