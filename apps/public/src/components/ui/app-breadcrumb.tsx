"use client";

import * as React from "react";
import { ComponentPropsWithoutRef, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MoreHorizontal } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@buildbase/ui/components/ui/breadcrumb";
import { Button } from "@buildbase/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@buildbase/ui/components/ui/dropdown-menu";
import { ScrollArea } from "@buildbase/ui/components/ui/scroll-area";

import { cn } from "@buildbase/ui/lib/utils";

/**
 * Maximum number of breadcrumb items to display before collapsing middle items into an ellipsis dropdown.
 */
const MAX_BREADCRUMB_ITEMS = 5;

/** Breadcrumb item configuration */
export interface BreadcrumbItemConfig {
  /**
   * Title text to display (optional if using custom renderer or icon-only)
   */
  title?: string;
  /**
   * URL path for the breadcrumb item (if not provided, item is rendered as current page)
   */
  href?: string;
  /**
   * Icon to display (can be used with or without title)
   */
  icon?: ReactNode;
  /**
   * Custom React node to render instead of default title/icon
   * Note: If both children and title are provided, children takes precedence
   */
  children?: ReactNode;
  /**
   * Custom className for the breadcrumb item
   */
  className?: string;
  /**
   * Custom className for the link (only applies when href is provided)
   */
  linkClassName?: string;
  /**
   * Custom className for the page (only applies when href is not provided)
   */
  pageClassName?: string;
  /**
   * Custom onClick handler (overrides default link behavior)
   */
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  /**
   * Additional props to pass to the link element
   */
  linkProps?: ComponentPropsWithoutRef<"a">;
  /**
   * Additional props to pass to the page element
   */
  pageProps?: ComponentPropsWithoutRef<"span">;
  /**
   * Custom renderer function for complete control over item rendering
   * If provided, this overrides all other rendering logic
   */
  render?: (props: {
    isLast: boolean;
    isLink: boolean;
    defaultContent: ReactNode;
  }) => ReactNode;
  /**
   * Additional UI elements to render inside the breadcrumb item (actions, badges, etc.)
   */
  actions?: ReactNode;
}

/**
 * Props for the AppBreadcrumb component
 */
export interface AppBreadcrumbProps
  extends Omit<ComponentPropsWithoutRef<"nav">, "children"> {
  /**
   * Array of breadcrumb items to display
   * If not provided, items will be auto-generated from the current URL
   */
  items?: BreadcrumbItemConfig[];
  /**
   * Custom separator between breadcrumb items
   * Default: ChevronRight icon
   */
  separator?: ReactNode;
  /**
   * Custom className for the breadcrumb container
   */
  className?: string;
  /**
   * Custom className for the breadcrumb list
   */
  listClassName?: string;
  /**
   * Custom renderer for separators (receives index)
   */
  separatorRenderer?: (index: number) => ReactNode;
  /**
   * Whether to show separators (default: true)
   */
  showSeparators?: boolean;
  /**
   * Custom link component (e.g., for custom routing)
   * Default: Next.js Link
   */
  linkComponent?: React.ComponentType<
    ComponentPropsWithoutRef<"a"> & { href: string }
  >;
  /**
   * Maximum number of items to show before collapsing (0 = no limit)
   */
  maxItems?: number;
  /**
   * Custom ellipsis component when items are collapsed
   */
  ellipsisComponent?: ReactNode;
  /**
   * Whether to include home breadcrumb when auto-generating (default: true)
   */
  includeHome?: boolean;
  /**
   * Custom home breadcrumb configuration when auto-generating
   */
  homeConfig?: BreadcrumbItemConfig;
  /**
   * Custom title formatter for auto-generated items
   * Receives the URL segment and returns the formatted title
   */
  formatTitle?: (segment: string) => string;
  /**
   * Array of paths to exclude from breadcrumb generation
   * For each path, only the last segment is extracted and that segment item is hidden from the breadcrumb
   * The path structure remains intact - only the matching segment items are hidden
   * @example ['/user', '/user/dashboard/posts'] - hides 'user' and 'posts' segment items, but preserves full path structure for hrefs
   */
  excludeSegments?: string[];
}

/**
 * Default separator component
 */
const DefaultSeparator = () => <BreadcrumbSeparator />;

/**
 * Format URL segment to readable title
 * Converts kebab-case, snake_case, or camelCase to Title Case
 */
export const formatSegmentToTitle = (segment: string): string => {
  // Split by kebab-case and snake_case first
  let words = segment.split(/[-_]/);

  // If no kebab/snake separators, try to split camelCase
  if (words.length === 1) {
    // Match camelCase: split before uppercase letters
    words = segment.split(/(?=[A-Z])/);
  }

  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/**
 * Extract segment names to exclude from excludeSegments paths
 * For each exclude path, extracts the last segment name
 * @returns Set of segment names that should be excluded from breadcrumb rendering
 */
export const getExcludedSegmentNames = (
  excludeSegments?: string[],
): Set<string> => {
  const segmentsToExclude = new Set<string>();

  if (!excludeSegments || excludeSegments.length === 0) {
    return segmentsToExclude;
  }

  for (const exclude of excludeSegments) {
    const normalizedExclude = exclude.startsWith("/") ? exclude : `/${exclude}`;
    const excludeSegs = normalizedExclude.split("/").filter(Boolean);

    if (excludeSegs.length > 0) {
      // Get the last segment of the exclude path
      const lastSegment = excludeSegs[excludeSegs.length - 1];
      if (lastSegment) {
        segmentsToExclude.add(lastSegment);
      }
    }
  }

  return segmentsToExclude;
};

/**
 * Generate breadcrumb items from URL pathname
 * Only excludes matching segment items while preserving full path structure
 */
export const generateBreadcrumbsFromPath = (
  pathname: string,
  includeHome: boolean = true,
  homeConfig?: BreadcrumbItemConfig,
  formatTitle?: (segment: string) => string,
  excludeSegments?: string[],
): BreadcrumbItemConfig[] => {
  // Normalize pathname
  const normalizedPathname = pathname.startsWith("/")
    ? pathname
    : `/${pathname}`;
  const segments = normalizedPathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return includeHome
      ? [
          homeConfig || {
            icon: <Home className="h-4 w-4" />,
            href: "/",
          },
        ]
      : [];
  }

  // Get excluded segment names (only compute once)
  const excludedSegmentNames = getExcludedSegmentNames(excludeSegments);
  const items: BreadcrumbItemConfig[] = [];

  // Add home breadcrumb if enabled
  if (includeHome) {
    items.push(
      homeConfig || {
        icon: <Home className="h-4 w-4" />,
        href: "/",
      },
    );
  }

  // Find last non-excluded index (reverse loop for early exit optimization)
  let lastNonExcludedIndex = -1;
  for (let i = segments.length - 1; i >= 0; i--) {
    if (!excludedSegmentNames.has(segments[i] || "")) {
      lastNonExcludedIndex = i;
      break;
    }
  }

  // Build breadcrumb items in single pass (preserving full path structure)
  let currentPath = "";
  for (let index = 0; index < segments.length; index++) {
    const segment = segments[index];

    // Build path for all segments (excluded or not) to maintain correct hrefs
    currentPath = currentPath ? `${currentPath}/${segment}` : `/${segment}`;

    // Only create breadcrumb item for non-excluded segments
    if (!excludedSegmentNames.has(segment || "")) {
      const isLast = index === lastNonExcludedIndex;
      items.push({
        title: formatTitle
          ? formatTitle(segment || "")
          : formatSegmentToTitle(segment || ""),
        href: isLast ? undefined : currentPath,
      });
    }
  }

  return items;
};

/**
 * Reusable Breadcrumb component built on shadcn/ui
 * Automatically generates breadcrumbs from URL if items are not provided
 *
 * @example Auto-generated from URL
 * ```tsx
 * // URL: /docs/getting-started
 * // Auto-generates: Home > Docs > Getting Started
 * <AppBreadcrumb />
 * ```
 *
 * @example Manual items
 * ```tsx
 * <AppBreadcrumb
 *   items={[
 *     { icon: <Home />, href: "/" },
 *     { title: "Documentation", href: "/docs" },
 *     { title: "Getting Started" }
 *   ]}
 * />
 * ```
 *
 * @example With custom separator
 * ```tsx
 * <AppBreadcrumb
 *   separator={<span>/</span>}
 * />
 * ```
 *
 * @example With custom title formatting
 * ```tsx
 * <AppBreadcrumb
 *   formatTitle={(segment) => {
 *     const map = { "api-docs": "API Documentation" };
 *     return map[segment] || segment;
 *   }}
 * />
 * ```
 *
 * @example With custom renderer
 * ```tsx
 * <AppBreadcrumb
 *   items={[
 *     {
 *       title: "Custom",
 *       render: ({ isLast, defaultContent }) => (
 *         <div className="custom-style">
 *           {defaultContent}
 *           {!isLast && <Badge>New</Badge>}
 *         </div>
 *       )
 *     }
 *   ]}
 * />
 * ```
 *
 * @example With exclude segments
 * ```tsx
 *  Current path: /user/dashboard/posts/history
 *  Exclude: ['/user', '/user/dashboard/posts']
 *  Hides last segment of each exclude path: 'user' and 'posts'
 *  Result: Home > Dashboard (href: /user/dashboard) > History
 *  Note: Full path structure is preserved for correct hrefs
 * <AppBreadcrumb
 *   excludeSegments={['/user', '/user/dashboard/posts']}
 * />
 * ```
 */
export const AppBreadcrumb = React.forwardRef<HTMLElement, AppBreadcrumbProps>(
  (
    {
      items,
      separator,
      className,
      listClassName,
      separatorRenderer,
      showSeparators = true,
      linkComponent: LinkComponent = Link,
      maxItems = MAX_BREADCRUMB_ITEMS,
      ellipsisComponent,
      includeHome = true,
      homeConfig,
      formatTitle,
      excludeSegments,
      ...navProps
    },
    ref,
  ) => {
    const pathname = usePathname();

    // Auto-generate items from URL if not provided
    const generatedItems = React.useMemo(() => {
      if (items !== undefined) {
        return items;
      }

      if (!pathname) {
        return [];
      }

      return generateBreadcrumbsFromPath(
        pathname,
        includeHome,
        homeConfig,
        formatTitle,
        excludeSegments,
      );
    }, [
      items,
      pathname,
      includeHome,
      homeConfig,
      formatTitle,
      excludeSegments,
    ]);

    // Handle maxItems with ellipsis and track hidden items
    const { displayItems, hiddenItems } = React.useMemo(() => {
      if (!generatedItems || generatedItems.length === 0) {
        return { displayItems: [], hiddenItems: [] };
      }

      if (maxItems === 0 || generatedItems.length <= maxItems) {
        return { displayItems: generatedItems, hiddenItems: [] };
      }

      // Guard against maxItems < 2 (would result in no current page)
      if (maxItems < 2) {
        return { displayItems: generatedItems, hiddenItems: [] };
      }

      const firstItem = generatedItems[0];
      const lastItems = generatedItems.slice(-(maxItems - 1));
      const hidden = generatedItems.slice(
        1,
        generatedItems.length - (maxItems - 1),
      );

      // Create ellipsis item with custom renderer for dropdown
      const ellipsisItem: BreadcrumbItemConfig = {
        title: "...",
        href: undefined, // Explicitly non-linkable
        render: () => {
          const triggerContent = ellipsisComponent ?? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 hover:bg-accent/50"
              aria-label="Show more breadcrumb items"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          );

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {triggerContent}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <ScrollArea className="max-h-[40vh]">
                  {hidden.map((item) => {
                    const itemContent = (
                      <>
                        {item.icon && (
                          <span className="flex items-center">{item.icon}</span>
                        )}
                        {item.children ? (
                          <span className={cn(item.icon && "ml-1.5")}>
                            {item.children}
                          </span>
                        ) : (
                          item.title && (
                            <span className={cn(item.icon && "ml-1.5")}>
                              {item.title}
                            </span>
                          )
                        )}
                      </>
                    );

                    if (item.href) {
                      return (
                        <DropdownMenuItem
                          key={`${item.href}-${item.title}`}
                          asChild
                        >
                          {item.onClick ? (
                            <button
                              type="button"
                              onClick={item.onClick}
                              className="cursor-pointer w-full"
                            >
                              {itemContent}
                            </button>
                          ) : (
                            <LinkComponent
                              href={item.href}
                              className="cursor-pointer"
                            >
                              {itemContent}
                            </LinkComponent>
                          )}
                        </DropdownMenuItem>
                      );
                    }

                    return (
                      <DropdownMenuItem
                        key={`page-${item.title}`}
                        className="cursor-default"
                      >
                        {itemContent}
                      </DropdownMenuItem>
                    );
                  })}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      };

      return {
        displayItems: [firstItem, ellipsisItem, ...lastItems],
        hiddenItems: hidden,
      };
    }, [generatedItems, maxItems, ellipsisComponent, LinkComponent]);

    if (!displayItems || displayItems.length === 0) {
      return null;
    }

    const renderItem = (
      item: BreadcrumbItemConfig,
      index: number,
    ): ReactNode => {
      const isLast = index === displayItems.length - 1;
      const isLink = !!item.href && !isLast;

      // Default content: icon + title or children
      // Note: If both children and title are provided, children takes precedence
      const defaultContent = (
        <>
          {item.icon && (
            <span className="flex items-center svg-4">{item.icon}</span>
          )}
          {item.children ? (
            <span className={cn(item.icon && "ml-1.5")}>{item.children}</span>
          ) : (
            item.title && (
              <span className={cn(item.icon && "ml-1.5")}>{item.title}</span>
            )
          )}
          {item.actions && (
            <span className="ml-2 flex items-center">{item.actions}</span>
          )}
        </>
      );

      // Generate stable key for React reconciliation
      const itemKey = `${item.href ?? "page"}-${index}`;

      // Use custom renderer if provided
      if (item.render) {
        return (
          <BreadcrumbItem key={itemKey} className={cn(item.className)}>
            {item.render({ isLast, isLink, defaultContent })}
          </BreadcrumbItem>
        );
      }

      // Default rendering
      if (isLink) {
        return (
          <BreadcrumbItem key={itemKey} className={item.className}>
            {item.onClick ? (
              <BreadcrumbLink asChild>
                <button
                  type="button"
                  onClick={item.onClick}
                  className={cn(
                    "transition-colors hover:text-foreground",
                    item.linkClassName,
                  )}
                  {...(item.linkProps as ComponentPropsWithoutRef<"button">)}
                >
                  {defaultContent}
                </button>
              </BreadcrumbLink>
            ) : (
              <BreadcrumbLink asChild>
                <LinkComponent
                  href={item.href!}
                  className={cn(
                    "transition-colors hover:text-foreground",
                    item.linkClassName,
                  )}
                  {...item.linkProps}
                >
                  {defaultContent}
                </LinkComponent>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
        );
      }

      // Current page (no link)
      return (
        <BreadcrumbItem key={itemKey} className={item.className}>
          <BreadcrumbPage
            className={cn(item.pageClassName)}
            {...item.pageProps}
          >
            {defaultContent}
          </BreadcrumbPage>
        </BreadcrumbItem>
      );
    };

    const renderSeparator = (index: number): ReactNode => {
      if (!showSeparators || index === displayItems.length - 1) {
        return null;
      }

      if (separatorRenderer) {
        return separatorRenderer(index);
      }

      if (separator) {
        return <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>;
      }

      return <DefaultSeparator />;
    };

    return (
      <Breadcrumb ref={ref} className={className} {...navProps}>
        <BreadcrumbList className={listClassName}>
          {displayItems.map((item, index) => (
            <React.Fragment key={index}>
              {renderItem(item || {}, index)}
              {renderSeparator(index)}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    );
  },
);

AppBreadcrumb.displayName = "AppBreadcrumb";

/**
 * Helper function to create breadcrumb items with common patterns
 */
export const createBreadcrumbItem = (
  config: BreadcrumbItemConfig,
): BreadcrumbItemConfig => config;

/**
 * Helper function to create a home breadcrumb item
 */
export const createHomeBreadcrumb = (
  href: string = "/",
  icon?: ReactNode,
): BreadcrumbItemConfig => ({
  href,
  icon: icon || <Home className="h-4 w-4" />,
});
