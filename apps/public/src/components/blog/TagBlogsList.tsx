"use client";

import { useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Routes } from "@/data/routes";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, MoveLeftIcon } from "lucide-react";

import { IBlogPost, IBlogTag } from "@/services/blogs";

import { AdvancedBlogCard } from "./AdvancedBlogCard";
import CustomButton from "../ui/custom-button";
import HeroBgWrapper from "../hero-bg-wrapper";
import { AppBreadcrumb } from "@buildbase/ui/components/ui/app-breadcrumb";
import { Button } from "@buildbase/ui/components/ui/button";
import PaginationControls from "@buildbase/ui/components/ui/pagination-controls";
import SearchBar, { ISearchBarRefType } from "@buildbase/ui/components/ui/search-bar";

import { filterBlogPosts } from "@/lib/blogs/blog-utils";

const ITEMS_PER_PAGE = 6;

// Search params keys for easy editing
const SEARCH_PARAMS = {
  SEARCH: "search",
  PAGE: "page",
} as const;

interface TagBlogsListProps {
  tagData: IBlogTag;
  posts: IBlogPost[];
  allTags: IBlogTag[];
}

const TagBlogsList = ({ tagData, posts, allTags }: TagBlogsListProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchBarRef = useRef<ISearchBarRefType>(null);

  // Extract all search params in a const
  const searchParamsValues = useMemo(
    () => ({
      search: searchParams.get(SEARCH_PARAMS.SEARCH) || "",
      page: parseInt(searchParams.get(SEARCH_PARAMS.PAGE) || "1", 10),
    }),
    [searchParams],
  );

  // Update URL search params
  const updateSearchParams = useCallback(
    (updates: { page?: number }) => {
      const params = new URLSearchParams(searchParams.toString());

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

  // Filter blogs based on search
  const filteredBlogs = useMemo(() => {
    return filterBlogPosts(posts, {
      search: searchParamsValues.search,
      allTags,
    });
  }, [posts, searchParamsValues.search, allTags]);

  // Paginate filtered blogs
  const totalPages = Math.ceil(filteredBlogs.length / ITEMS_PER_PAGE);
  const paginatedBlogs = useMemo(() => {
    const startIndex = (searchParamsValues.page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredBlogs.slice(startIndex, endIndex);
  }, [filteredBlogs, searchParamsValues.page]);

  const clearSearch = useCallback(() => {
    searchBarRef.current?.resetQuery();
  }, []);

  const handlePageChange = useCallback(
    (page: number) => {
      updateSearchParams({ page });
    },
    [updateSearchParams],
  );

  return (
    <div className="flex h-full flex-col">
      <HeroBgWrapper>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-center px-4">
          {tagData.title}
        </h1>
      </HeroBgWrapper>
      <AppBreadcrumb className="my-2" />
      <div className="flex flex-col gap-5 md:gap-10 p-0 w-full rounded-xl mx-auto">
        <div className="space-y-1">
          {/* Search Section */}
          <div className="flex-1 max-w-md w-full">
            <SearchBar
              ref={searchBarRef}
              queryKey={SEARCH_PARAMS.SEARCH}
              placeholder="Search blogs..."
              onValueChangeSetParams={{ page: "1" }}
            />
          </div>

          {/* Results Count */}
          <div className="text-xs sm:text-sm text-muted-foreground">
            Showing{" "}
            {paginatedBlogs.length > 0
              ? (searchParamsValues.page - 1) * ITEMS_PER_PAGE + 1
              : 0}{" "}
            to{" "}
            {Math.min(
              searchParamsValues.page * ITEMS_PER_PAGE,
              filteredBlogs.length,
            )}{" "}
            of {filteredBlogs.length} blog
            {filteredBlogs.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Blogs Grid */}
        <AnimatePresence mode="wait">
          {paginatedBlogs.length > 0 ? (
            <motion.div
              key={`${searchParamsValues.page}-${searchParamsValues.search}`}
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
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No blogs found</h3>
              <p className="text-muted-foreground mb-4">
                {searchParamsValues.search
                  ? "Try adjusting your search criteria"
                  : "There are no blogs available for this tag right now. Please check back later or explore other tags."}
              </p>
              {searchParamsValues.search && (
                <Button
                  onClick={clearSearch}
                  variant="outline"
                  className="px-6"
                >
                  Clear search
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {totalPages > 1 && (
          <PaginationControls
            currentPage={searchParamsValues.page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            scrollToTop={true}
            maxVisible={5}
          />
        )}

        {/* Back to Tags Button */}
        <div className="flex justify-center items-center mt-4">
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
    </div>
  );
};

export default TagBlogsList;
