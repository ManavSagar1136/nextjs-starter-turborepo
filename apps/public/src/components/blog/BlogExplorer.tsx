"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Routes } from "@/data/routes";
import { ChevronDown, ChevronRight, ChevronUp } from "lucide-react";

import { IBlogPost, IBlogTag } from "@/services/blogs";

import { AdvancedBlogCard } from "./AdvancedBlogCard";
import BlogsError from "./BlogsError";
import HeroBgWrapper from "../hero-bg-wrapper";
import { AppBreadcrumb } from "@buildbase/ui/components/ui/app-breadcrumb";
import { Badge } from "@buildbase/ui/components/ui/badge";
import { Button } from "@buildbase/ui/components/ui/button";

import { extractSlugPart } from "@/lib/blogs/blog-adapter";
import { filterBlogPosts, formatGroupName } from "@/lib/blogs/blog-utils";
import { cn } from "@buildbase/ui/lib/utils";

// Estimate: ~14 items per row, so 3 rows = ~42 items
const ITEMS_PER_ROW_ESTIMATE = 14;
const MAX_ROWS = 3;
const INITIAL_ITEMS_TO_SHOW = ITEMS_PER_ROW_ESTIMATE * MAX_ROWS;
const BLOGS_PER_ITEM = 3;

type Mode = "tags" | "groups";

interface BlogExplorerProps {
  mode?: Mode;
  allTags: IBlogTag[];
  allBlogs: IBlogPost[];
  allFolders?: Array<{
    id: string;
    name: string;
    slug: string;
    path: string;
    parentFolderId?: string | null;
  }>; // Optional folders prop for groups mode
}

const getExplorerConfig = (mode: Mode) => {
  if (mode === "tags") {
    return {
      title: "Browse Articles by Topic",
      description:
        "Explore our collection of articles organized by topics. Select any topic below to discover related guides, tutorials, and insights.",
      selectorLabel: "Select a topic:",
      noArticlesMessage: "No articles found for this topic yet.",
      tryDifferentMessage: "Try selecting a different topic above.",
      emptyStateMessage:
        "Currently, there are no tags to display. Tags help you explore specific topics, and we're working on adding more soon. In the meantime, feel free to browse our categories or search for content that interests you",
      mode: "tags",
    };
  } else {
    return {
      title: "Browse Articles by Category",
      description:
        "Explore our collection of articles organized by categories. Select any category below to discover related guides, tutorials, and insights.",
      selectorLabel: "Select a category:",
      noArticlesMessage: "No articles found for this category yet.",
      tryDifferentMessage: "Try selecting a different category above.",
      emptyStateMessage:
        "Currently, there are no groups to display. Groups help you explore articles organized by categories, and we're working on adding more soon. In the meantime, feel free to browse our tags or search for content that interests you",
      mode: "groups",
    };
  }
};

const getItems = ({
  mode,
  allTags,
  allBlogs,
  allFolders,
}: {
  mode: Mode;
  allTags: IBlogTag[];
  allBlogs: IBlogPost[];
  allFolders?: Array<{
    id: string;
    name: string;
    slug: string;
    path: string;
    parentFolderId?: string | null;
  }>;
}) => {
  if (mode === "tags") {
    return allTags.map((tag) => {
      // Use the full slug path for navigation, but extract slug part for display
      const slugPart = extractSlugPart(tag.slug);
      return {
        title: tag.title,
        slug: tag.url || `${Routes.blogTags}/${slugPart}`, // Full URL path for navigation
        path: tag.url || `${Routes.blogTags}/${slugPart}`,
        slugPart, // Just the slug part for matching
      };
    });
  } else {
    // For groups, use folders directly if provided, otherwise fallback to extracting from blogs
    if (allFolders && allFolders.length > 0) {
      // Extract all parent paths from folders (e.g., "tech/react" -> ["tech", "tech/react"])
      const groupPaths = new Set<string>();
      allFolders.forEach((folder) => {
        if (folder.path) {
          const pathParts = folder.path.split("/").filter(Boolean);
          for (let i = 1; i <= pathParts.length; i++) {
            groupPaths.add(pathParts.slice(0, i).join("/"));
          }
        }
      });
      return Array.from(groupPaths).map((path) => ({
        title: formatGroupName(path),
        slug: path,
        path: path,
      }));
    }
    // Fallback: extract from blogs if folders not provided (backward compatibility)
    const groupPaths = new Set<string>();
    allBlogs.forEach((blog) => {
      if (blog.folder?.path) {
        const pathParts = blog.folder.path.split("/").filter(Boolean);
        for (let i = 1; i <= pathParts.length; i++) {
          groupPaths.add(pathParts.slice(0, i).join("/"));
        }
      }
    });
    return Array.from(groupPaths).map((path) => ({
      title: formatGroupName(path),
      slug: path,
      path: path,
    }));
  }
};

const getFilteredBlogs = ({
  mode,
  selectedItemSlug,
  allTags,
  allBlogs,
}: {
  mode: Mode;
  selectedItemSlug: string;
  allTags: IBlogTag[];
  allBlogs: IBlogPost[];
}) => {
  if (!selectedItemSlug) return [];
  
  // For tags mode, extract the slug part from the full slug path
  // filterBlogPosts will also extract it, but we do it here for clarity
  const filterValue = mode === "tags" 
    ? extractSlugPart(selectedItemSlug)
    : selectedItemSlug;
  
  const filtered = filterBlogPosts(allBlogs, {
    ...(mode === "tags"
      ? { selectedTags: [filterValue] }
      : { folderPath: filterValue }),
    allTags,
  });

  return filtered.slice(0, BLOGS_PER_ITEM);
};

const BlogExplorer = ({
  mode = "tags",
  allBlogs,
  allTags,
  allFolders,
}: BlogExplorerProps) => {
  const {
    title,
    description,
    selectorLabel,
    noArticlesMessage,
    tryDifferentMessage,
    emptyStateMessage,
    items,
  } = useMemo(() => {
    const config = getExplorerConfig(mode);
    const items = getItems({ mode, allTags, allBlogs, allFolders });
    return { ...config, items };
  }, [mode, allTags, allBlogs, allFolders]);

  const [selectedItemSlug, setSelectedItemSlug] = useState<string>("");
  
  // Update selectedItemSlug when items change (e.g., on initial load)
  useEffect(() => {
    if (!selectedItemSlug && items.length > 0) {
      setSelectedItemSlug(items[0]?.slug || "");
    }
  }, [items, selectedItemSlug]);
  const [isItemsExpanded, setIsItemsExpanded] = useState(false);

  const selectedItem = useMemo(
    () => items.find((item) => item.slug === selectedItemSlug),
    [items, selectedItemSlug],
  );

  const filteredBlogs = useMemo(
    () => getFilteredBlogs({ mode, selectedItemSlug, allTags, allBlogs }),
    [selectedItemSlug, mode, allTags, allBlogs],
  );

  const shouldShowExpandButton = items.length > INITIAL_ITEMS_TO_SHOW;
  const hiddenItemsCount = items.length - INITIAL_ITEMS_TO_SHOW;

  const itemsToDisplay = useMemo(() => {
    if (isItemsExpanded || !shouldShowExpandButton) {
      return items;
    }
    return items.slice(0, INITIAL_ITEMS_TO_SHOW);
  }, [items, isItemsExpanded, shouldShowExpandButton]);

  const handleItemSelect = useCallback((itemSlug: string) => {
    setSelectedItemSlug(itemSlug);
  }, []);

  const handleToggleExpand = useCallback(() => {
    setIsItemsExpanded((prev) => !prev);
  }, []);

  if (items.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <BlogsError subTitle={emptyStateMessage} />
      </div>
    );
  }

  return (
    <>
      <HeroBgWrapper>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-center px-4">
          {title}
        </h1>
        <p className="text-sm lg:text-base text-center px-4 max-w-2xl line-clamp-2">
          {description}
        </p>
      </HeroBgWrapper>
      <div className="relative mx-auto rounded-xl flex flex-col gap-4 w-full py-3 md:py-5">
        <AppBreadcrumb className="mb-2" />
        <div className="flex md:gap-5 w-full">
          <div className="flex flex-col justify-center items-center flex-1 rounded-[10px]">
            {/* Item Selector (Tags or Groups) */}
            <div className="w-full">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-medium select-none text-slate-400 dark:text-slate-600">
                  {selectorLabel}
                </span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded ml-1 bg-slate-100 dark:bg-dark-surface-elevated text-slate-400 dark:text-slate-600"
                >
                  Tap or click to filter
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {itemsToDisplay.map((item) => (
                  <Badge
                    key={item.slug}
                    variant={
                      selectedItemSlug === item.slug ? "default" : "outline"
                    }
                    className={cn(
                      "cursor-pointer transition-all text-xs py-1.5 px-3 font-medium",
                      "hover:scale-105 active:scale-95",
                      selectedItemSlug === item.slug
                        ? "bg-indigo-500 text-white border-indigo-500"
                        : "bg-slate-50 dark:bg-dark-surface-secondary text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700",
                    )}
                    onClick={() => handleItemSelect(item.slug)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleItemSelect(item.slug);
                      }
                    }}
                    aria-label={`Filter blogs by ${item.title} ${
                      mode === "tags" ? "topic" : "category"
                    }`}
                  >
                    {item.title}
                  </Badge>
                ))}
              </div>
              {shouldShowExpandButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleExpand}
                  className="w-full md:w-fit text-xs h-7 mt-1"
                  aria-label={
                    isItemsExpanded
                      ? `Show fewer ${mode === "tags" ? "topics" : "categories"}`
                      : `Show ${hiddenItemsCount} more ${
                          mode === "tags" ? "topics" : "categories"
                        }`
                  }
                >
                  {isItemsExpanded ? (
                    <>
                      Show Less
                      <ChevronUp className="h-3 w-3 ml-1" />
                    </>
                  ) : (
                    <>
                      View All ({hiddenItemsCount} more)
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Selected Item Blogs */}
            {selectedItem && (
              <section className="overflow-visible w-full flex flex-col gap-3 mt-2">
                <div className="w-full mb-2 py-1 border-b border-slate-200 dark:border-slate-800">
                  <h2 className="text-lg md:text-xl font-bold capitalize text-slate-900 dark:text-slate-50">
                    Articles {mode === "tags" ? "about" : "in"}{" "}
                    {selectedItem.title}
                  </h2>
                </div>
                {filteredBlogs.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredBlogs.map((blog) => (
                        <AdvancedBlogCard
                          key={blog.id}
                          data={blog}
                          allTags={allTags}
                        />
                      ))}
                    </div>
                    <div className="flex justify-center items-center mt-8">
                      <Link
                        href={
                          mode === "tags"
                            ? selectedItem.slug // Already contains full URL path
                            : `${Routes.blogs}/${selectedItem.path}`
                        }
                      >
                        <Button
                          variant="default"
                          size="default"
                          className="flex gap-2 animate-fade-in rounded-lg px-4 py-2 text-sm font-semibold shadow-md hover:shadow-lg transition-all hover:scale-105"
                          aria-label={`View all articles ${
                            mode === "tags" ? "about" : "in"
                          } ${selectedItem.title}`}
                        >
                          View All {selectedItem.title} Articles
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col justify-center items-center py-8 text-center">
                    <p className="text-sm mb-1 text-slate-600 dark:text-slate-400">
                      {noArticlesMessage}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-600">
                      {tryDifferentMessage}
                    </p>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogExplorer;
