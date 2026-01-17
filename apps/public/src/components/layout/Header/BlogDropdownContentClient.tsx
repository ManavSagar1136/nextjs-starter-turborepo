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

import { formatGroupName } from "@/lib/blogs/blog-utils";
import { cn } from "@buildbase/ui/lib/utils";

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
    icon: <Folder className="text-muted-foreground h-4 w-4" />,
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
    icon: <TagIcon className="text-muted-foreground h-4 w-4" />,
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
 * Client component that renders the blog dropdown UI.
 * Receives pre-fetched data from the server component.
 */
interface IBlogDropdownContentClientProps {
  tags: IBlogTag[];
  groups: string[];
  isMobile?: boolean;
  onLinkClick?: () => void;
  error?: boolean;
}

const BlogDropdownContentClient = ({
  tags,
  groups,
  isMobile = false,
  onLinkClick,
  error = false,
}: IBlogDropdownContentClientProps) => {
  // Pathname for highlighting active links
  const pathname = usePathname();

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
    [tags, groups, error, pathname, onLinkClick, isMobile],
  );

  // Mobile accordion view
  if (isMobile) {
    return (
      <Accordion type="multiple" className="w-full space-y-2 pl-1.5 pt-1.5">
        {sections.map((section) => (
          <AccordionItem
            key={section.title}
            value={section.title}
            className={cn("border-none")}
          >
            <AccordionTrigger className="hover:bg-accent rounded-lg p-2 hover:no-underline">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center">
                  {section.icon}
                </div>
                <h3 className="text-foreground text-sm font-semibold tracking-tight">
                  {section.title}
                </h3>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-0 pt-1">
              <div className="space-y-2">
                <DataStateRenderer<any>
                  data={section.data}
                  loading={false}
                  error={section.showError}
                  className="grid grid-cols-1 gap-2"
                  renderItem={section.renderItem}
                  renderSkeleton={<Skeleton className="h-[34px] w-full rounded-lg" />}
                  skeletonCount={6}
                  renderError={section.renderError}
                  renderEmpty={section.renderEmpty}
                />
                {/* Show "View all" link if loaded and has data */}
                {!error && section.data.length > 0 && (
                  <Link
                    href={section.viewAllHref}
                    onClick={onLinkClick}
                    className={cn(
                      "flex-center group gap-1.5 text-xs font-medium",
                      "text-muted-foreground hover:text-foreground",
                      "transition-all duration-200 ease-in-out",
                      "rounded-lg px-2 py-1.5",
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
    <div className="@container rounded-20 w-[75vw] max-w-3xl overflow-hidden">
      {/* Iterate over each dropdown section (category, topic) */}
      {sections.map((section, sectionIndex) => (
        <div
          key={section.title}
          className={cn(
            "space-y-4 p-5",
            // Add border for all except last section
            sectionIndex < sections.length - 1 && "border-border/50 border-b",
          )}
        >
          {/* Section heading (icon and title) and optional "View all" link */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center">{section.icon}</div>
              <h3 className="text-foreground text-sm font-semibold tracking-tight">
                {section.title}
              </h3>
            </div>

            {/* Show "View all" link if loaded and has data */}
            {!error && section.data.length > 0 && (
              <NavigationMenuLink asChild>
                <Link
                  href={section.viewAllHref}
                  className={cn(
                    "group flex items-center gap-1.5 text-xs font-medium",
                    "text-muted-foreground hover:text-foreground",
                    "transition-all duration-200 ease-in-out",
                    "-mr-1.5 px-1.5 py-0.5",
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
          <ScrollArea className="h-fit max-h-[20vh]">
            <DataStateRenderer<any>
              data={section.data}
              loading={false}
              error={section.showError}
              className="grid grid-cols-1 gap-2.5 sm:grid-cols-2"
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

export { BlogDropdownContentClient };
