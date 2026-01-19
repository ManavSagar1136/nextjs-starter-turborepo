"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Routes } from "@/data/routes";
import { ArrowRight, Folder, Tag as TagIcon } from "lucide-react";

import { IBlogTag } from "@/services/blogs";

import { DataStateRenderer } from "@buildbase/ui/components/ui/data-state-renderer";
import { ScrollArea } from "@buildbase/ui/components/ui/scroll-area";
import { Skeleton } from "@buildbase/ui/components/ui/skeleton";

import { adaptTag } from "@/lib/blogs/blog-adapter";
import { formatGroupName } from "@/lib/blogs/blog-utils";
import { cn } from "@buildbase/ui/lib/utils";
import { useBlogFolders, useBlogTags } from "@/hooks/use-blogs";

import {
  HeaderDropDownEmptyView,
  HeaderDropDownErrorView,
  HeaderDropDownLinkItem,
} from ".";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@buildbase/ui/accordion";
import { NavigationMenuLink } from "@buildbase/ui/components/ui/navigation-menu";

/**
 * Structured interface representing the set of blog content items loaded into the dropdown:
 * - tags: all tag objects
 * - groups: all blog group (category) slugs
 */
interface IBlogContent {
  tags: IBlogTag[];
  groups: string[];
}

/**
 * Processes blog data from TanStack Query hooks into the format needed for the dropdown.
 * Sorts tags and extracts unique group paths from folders (categories).
 */
const processBlogContent = (
  tagsData: any[] | undefined,
  foldersData: any[] | undefined,
): IBlogContent => {
  // Convert API tags to UI format and sort alphabetically by title.
  const tags = (tagsData || []).map((tag: any) => adaptTag(tag));
  const sortedTags = tags.sort((a: IBlogTag, b: IBlogTag) =>
    a.title.localeCompare(b.title),
  );

  // Extract unique group paths from folders (categories)
  // Folders have a path field like "tech/react" - we extract all parent paths
  const groupPaths = new Set<string>();
  (foldersData || []).forEach((folder: any) => {
    if (folder.path) {
      // Extract all parent paths (e.g., "tech/react" -> ["tech", "tech/react"])
      const pathParts = folder.path.split("/").filter(Boolean);
      for (let i = 1; i <= pathParts.length; i++) {
        groupPaths.add(pathParts.slice(0, i).join("/"));
      }
    }
  });
  const sortedGroups = Array.from(groupPaths).sort((a, b) =>
    a.localeCompare(b),
  );

  return { tags: sortedTags, groups: sortedGroups };
};

/**
 * Returns the sections definition for the dropdown panel, including category and tag/topic sections.
 * Each section provides rendering for link items, loading/empty/error views, and section headings.
 *
 * @param tags        Data and error state for tags
 * @param groups      Data and error state for groups
 * @param activeUrl   The current URL path (for active highlighting)
 * @param onLinkClick Optional callback to execute when link is clicked (e.g., close sheet)
 * @returns           Array of section config objects
 */
const getSections = ({
  tags,
  groups,
  activeUrl,
  onLinkClick,
  withNavigationMenuLink = false,
}: {
  tags: {
    items: IBlogTag[];
    error: boolean;
  };
  groups: {
    items: string[];
    error: boolean;
  };
  activeUrl?: string;
  onLinkClick?: () => void;
  withNavigationMenuLink?: boolean;
}) => [
  {
    // Category section enumerates blog groups ("folders")
    title: "Category",
    icon: <Folder className="h-4 w-4 text-muted-foreground" />,
    data: groups.items,
    viewAllHref: Routes.blogGroups,
    showError: groups.error,
    renderItem: (groupPath: string) => (
      <HeaderDropDownLinkItem
        href={`${Routes.blogs}/${groupPath as string}`}
        aria-label={`View blogs in ${formatGroupName(groupPath as string)} category`}
        activeUrl={activeUrl}
        onLinkClick={onLinkClick}
        withNavigationMenuLink={withNavigationMenuLink}
      >
        {formatGroupName(groupPath as string)}
      </HeaderDropDownLinkItem>
    ),
    renderError: () => (
      <HeaderDropDownErrorView message="Failed to load categories" />
    ),
    renderEmpty: () => (
      <HeaderDropDownEmptyView message="No categories available" />
    ),
  },
  {
    // Topic section enumerates blog tags/topics
    title: "Topic",
    icon: <TagIcon className="h-4 w-4 text-muted-foreground" />,
    data: tags.items,
    viewAllHref: Routes.blogTags,
    showError: tags.error,
    renderItem: (tag: IBlogTag) => (
      <HeaderDropDownLinkItem
        href={tag.slug}
        aria-label={`View blogs tagged with ${tag.title}`}
        activeUrl={activeUrl}
        onLinkClick={onLinkClick}
        withNavigationMenuLink={withNavigationMenuLink}
      >
        {tag.title}
      </HeaderDropDownLinkItem>
    ),
    renderError: () => (
      <HeaderDropDownErrorView message="Failed to load topics" />
    ),
    renderEmpty: () => (
      <HeaderDropDownEmptyView message="No topics available" />
    ),
  },
];

/**
 * BlogDropdownContent renders a dropdown panel for the header navigation's "Blogs" section.
 * It includes:
 * - Listing blog categories (groups)
 * - Listing blog topics (tags)
 * - Proper loading, error, and empty states for both
 *
 * Handles asynchronous data retrieval, UI state management, and provides
 * keyboard accessibility and visual feedback for all states.
 *
 * Supports two rendering variants:
 * - Desktop: Grid layout with sections side by side
 * - Mobile: Accordion layout with collapsible sections
 *
 * @component
 * @param isMobile    Whether to render mobile accordion view
 * @param onLinkClick Optional callback to execute when link is clicked (e.g., close sheet)
 * @returns JSX.Element
 */
interface IBlogDropdownContentProps {
  isMobile?: boolean;
  onLinkClick?: () => void;
}

const BlogDropdownContent = ({
  isMobile = false,
  onLinkClick,
}: IBlogDropdownContentProps = {}) => {
  // Pathname for highlighting active links
  const pathname = usePathname();

  // Fetch blog tags and folders (categories) using TanStack Query
  const {
    data: tagsData,
    isLoading: isLoadingTags,
    isError: isErrorTags,
  } = useBlogTags({
    limit: 10,
  });

  const {
    data: foldersData,
    isLoading: isLoadingFolders,
    isError: isErrorFolders,
  } = useBlogFolders({
    limit: 10,
  });

  // Process the fetched data into the format needed for the dropdown
  const blogContent = useMemo(
    () => processBlogContent(tagsData, foldersData),
    [tagsData, foldersData],
  );

  const { tags, groups } = blogContent;

  // Combined loading and error states
  const isLoading = isLoadingTags || isLoadingFolders;
  const error = isErrorTags || isErrorFolders;

  /**
   * Compute the dropdown sections (category, topic) based on fetched state and error/loading,
   * memoized to reduce unnecessary render recalculations.
   */
  const sections = useMemo(
    () =>
      getSections({
        tags: { items: tags, error: error },
        groups: { items: groups, error: error },
        activeUrl: pathname,
        onLinkClick,
        withNavigationMenuLink: !isMobile,
      }),
    [tags, groups, error, pathname, onLinkClick, isMobile, isLoading],
  );

  // Mobile accordion view
  if (isMobile) {
    return (
      <Accordion type="multiple" className="w-full pl-1.5 space-y-2 pt-1.5">
        {sections.map((section) => (
          <AccordionItem
            key={section.title}
            value={section.title}
            className={cn("border-none")}
          >
            <AccordionTrigger className="hover:no-underline hover:bg-accent p-2 rounded-lg">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center">
                  {section.icon}
                </div>
                <h3 className="text-sm font-semibold text-foreground tracking-tight">
                  {section.title}
                </h3>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-1 pb-0">
              <div className="space-y-2">
                <DataStateRenderer<any>
                  data={section.data}
                  loading={isLoading}
                  error={section.showError}
                  className="grid grid-cols-1 gap-2"
                  renderItem={section.renderItem}
                  renderSkeleton={
                    <Skeleton className="h-[34px] w-full rounded-lg" />
                  }
                  skeletonCount={6}
                  renderError={section.renderError}
                  renderEmpty={section.renderEmpty}
                />
                {/* Show "View all" link if loaded and has data */}
                {!isLoading && !error && section.data.length > 0 && (
                  <Link
                    href={section.viewAllHref}
                    onClick={onLinkClick}
                    className={cn(
                      "group flex-center gap-1.5 text-xs font-medium",
                      "text-muted-foreground hover:text-foreground",
                      "transition-all duration-200 ease-in-out",
                      "px-2 py-1.5 rounded-lg",
                      "hover:bg-accent",
                    )}
                    tabIndex={0}
                    aria-label={`View all ${section.title.toLowerCase()}`}
                  >
                    <span>View all</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );
  }

  // Desktop view (existing layout)
  return (
    <div className="@container w-[75vw] max-w-3xl rounded-20 overflow-hidden">
      {/* Iterate over each dropdown section (category, topic) */}
      {sections.map((section, sectionIndex) => (
        <div
          key={section.title}
          className={cn(
            "space-y-4 p-5",
            // Add border for all except last section
            sectionIndex < sections.length - 1 && "border-b border-border/50",
          )}
        >
          {/* Section heading (icon and title) and optional "View all" link */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center">
                {section.icon}
              </div>
              <h3 className="text-sm font-semibold text-foreground tracking-tight">
                {section.title}
              </h3>
            </div>

            {/* Show "View all" link if loaded and has data */}
            {!isLoading && !error && section.data.length > 0 && (
              <NavigationMenuLink asChild>
                <Link
                  href={section.viewAllHref}
                  className={cn(
                    "group flex items-center gap-1.5 text-xs font-medium",
                    "text-muted-foreground hover:text-foreground",
                    "transition-all duration-200 ease-in-out",
                    "px-1.5 py-0.5 -mr-1.5",
                  )}
                  tabIndex={0}
                  aria-label={`View all ${section.title.toLowerCase()}`}
                >
                  <span>View all</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </NavigationMenuLink>
            )}
          </div>

          {/* Scrollable section panel containing grid of links or skeletons */}
          <ScrollArea className="max-h-[20vh] h-fit">
            <DataStateRenderer<any>
              data={section.data}
              loading={isLoading}
              error={section.showError}
              className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
              renderItem={section.renderItem}
              renderSkeleton={
                <Skeleton className="h-[34px] w-full rounded-lg" />
              }
              skeletonCount={6}
              renderError={section.renderError}
              renderEmpty={section.renderEmpty}
            />
          </ScrollArea>
        </div>
      ))}
    </div>
  );
};

export default BlogDropdownContent;
