"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Routes } from "@/data/routes";
import { formatGroupName } from "@buildbase/utils/path-utils";
import { ArrowRight, FileText, Folder } from "lucide-react";

import { IDocPost } from "@/services/docs";

import { DataStateRenderer } from "@buildbase/ui/components/ui/data-state-renderer";
import { ScrollArea } from "@buildbase/ui/components/ui/scroll-area";
import { Skeleton } from "@buildbase/ui/components/ui/skeleton";

import { cn } from "@buildbase/ui/lib/utils";
import { useDocFolders, useDocPosts } from "@/hooks/use-docs";

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
 * Structured interface representing the set of doc content items loaded into the dropdown:
 * - groups: all doc folder paths
 * - docs: root-level individual doc pages
 */
interface IDocsContent {
  groups: string[];
  docs: IDocPost[];
}

/**
 * Processes doc data from TanStack Query hooks into the format needed for the dropdown.
 * Extracts root-level folders and docs, and sorts them.
 */
const processDocsContent = (
  foldersData: any[] | undefined,
  docsData: any[] | undefined,
): IDocsContent => {
  // Extract unique group paths from folders
  // Folders have a path field like "guides/api" - we extract all parent paths
  const groupPaths = new Set<string>();
  (foldersData || []).forEach((folder: any) => {
    if (folder.path) {
      // Extract all parent paths (e.g., "guides/api" -> ["guides", "guides/api"])
      const pathParts = folder.path.split("/").filter(Boolean);
      for (let i = 1; i <= pathParts.length; i++) {
        groupPaths.add(pathParts.slice(0, i).join("/"));
      }
    } else if (!folder.parentFolderId) {
      // Root-level folder without path
      groupPaths.add(folder.slug);
    }
  });
  const sortedGroups = Array.from(groupPaths).sort((a, b) =>
    a.localeCompare(b),
  );

  // Get root-level docs (docs without folder) and sort alphabetically by title
  const rootDocs = (docsData || [])
    .filter((doc: IDocPost) => !doc.folderId)
    .sort((a, b) => (a.title || "").localeCompare(b.title || ""));

  return { groups: sortedGroups, docs: rootDocs };
};

/**
 * Returns the sections definition for the dropdown panel, including category and documents sections.
 * Each section provides rendering for link items, loading/empty/error views, and section headings.
 *
 * @param groups     Data and error state for groups
 * @param docs       Data and error state for docs
 * @param activeUrl  The current URL path (for active highlighting)
 * @param onLinkClick Optional callback to execute when link is clicked (e.g., close sheet)
 * @returns          Array of section config objects
 */
const getSections = ({
  groups,
  docs,
  activeUrl,
  onLinkClick,
  withNavigationMenuLink = false,
}: {
  groups: {
    items: string[];
    error: boolean;
  };
  docs: {
    items: IDocPost[];
    error: boolean;
  };
  activeUrl?: string;
  onLinkClick?: () => void;
  withNavigationMenuLink?: boolean;
}) => [
  {
    // Category section enumerates doc groups ("folders")
    title: "Category",
    icon: <Folder className="h-4 w-4 text-slate-400 dark:text-slate-600" />,
    data: groups.items,
    viewAllHref: Routes.docs,
    showError: groups.error,
    renderItem: (groupPath: string) => (
      <HeaderDropDownLinkItem
        href={`${Routes.docs}/${groupPath as string}`}
        aria-label={`View docs in ${formatGroupName(groupPath as string)} category`}
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
    // Documents section enumerates root-level individual doc pages
    title: "Documents",
    icon: <FileText className="h-4 w-4 text-slate-400 dark:text-slate-600" />,
    data: docs.items,
    viewAllHref: Routes.docs,
    showError: docs.error,
    renderItem: (doc: IDocPost) => (
      <HeaderDropDownLinkItem
        href={doc.url || `/docs/${doc.slug}`}
        aria-label={`View ${doc.title} documentation`}
        activeUrl={activeUrl}
        onLinkClick={onLinkClick}
        withNavigationMenuLink={withNavigationMenuLink}
      >
        {doc.title}
      </HeaderDropDownLinkItem>
    ),
    renderError: () => (
      <HeaderDropDownErrorView message="Failed to load documents" />
    ),
    renderEmpty: () => (
      <HeaderDropDownEmptyView message="No documents available" />
    ),
  },
];

/**
 * DocsDropdownContent renders a dropdown panel for the header navigation's "Docs" section.
 * It includes:
 * - Listing doc categories (groups)
 * - Listing root-level individual doc pages
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
interface IDocsDropdownContentProps {
  isMobile?: boolean;
  onLinkClick?: () => void;
}

const DocsDropdownContent = ({
  isMobile = false,
  onLinkClick,
}: IDocsDropdownContentProps = {}) => {
  // Pathname for highlighting active links
  const pathname = usePathname();

  // Fetch doc folders and posts using TanStack Query
  const {
    data: foldersData,
    isLoading: isLoadingFolders,
    isError: isErrorFolders,
  } = useDocFolders({
    limit: 10,
  });

  const {
    data: docsData,
    isLoading: isLoadingDocs,
    isError: isErrorDocs,
  } = useDocPosts({
    limit: 10,
  });

  // Process the fetched data into the format needed for the dropdown
  const docsContent = useMemo(
    () =>
      processDocsContent(
        foldersData,
        docsData?.data || (docsData as any)?.docs || [],
      ),
    [foldersData, docsData],
  );

  const { groups, docs } = docsContent;

  // Combined loading and error states
  const isLoading = isLoadingFolders || isLoadingDocs;
  const error = isErrorFolders || isErrorDocs;

  /**
   * Compute the dropdown sections (category, documents) based on fetched state and error/loading,
   * memoized to reduce unnecessary render recalculations.
   */
  const sections = useMemo(
    () =>
      getSections({
        groups: { items: groups, error: error },
        docs: { items: docs, error: error },
        activeUrl: pathname,
        onLinkClick,
        withNavigationMenuLink: !isMobile,
      }),
    [groups, docs, error, pathname, onLinkClick, isMobile],
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
            <AccordionTrigger className="hover:no-underline hover:bg-slate-100 dark:hover:bg-dark-surface-elevated p-2 rounded-lg">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center">
                  {section.icon}
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 tracking-tight">
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
                  className="grid grid-cols-1 gap-2.5"
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
                      "text-slate-400 dark:text-slate-600 hover:text-slate-900 dark:hover:text-slate-50",
                      "transition-all duration-200 ease-in-out",
                      "px-2 py-1.5 rounded-lg",
                      "hover:bg-slate-100 dark:hover:bg-dark-surface-elevated",
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
      {/* Iterate over each dropdown section (category, documents) */}
      {sections.map((section, sectionIndex) => (
        <div
          key={section.title}
          className={cn(
            "space-y-4 p-5",
            // Add border for all except last section
            sectionIndex < sections.length - 1 && "border-b border-slate-200/50 dark:border-slate-800/50",
          )}
        >
          {/* Section heading (icon and title) and optional "View all" link */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center">
                {section.icon}
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 tracking-tight">
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
                    "text-slate-400 dark:text-slate-600 hover:text-slate-900 dark:hover:text-slate-50",
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

export default DocsDropdownContent;
