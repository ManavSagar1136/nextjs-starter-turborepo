"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@buildbase/ui/components/ui/breadcrumb";

export interface DashboardBreadcrumbProps {
  /**
   * Array of path segments to exclude from breadcrumb generation
   * @example ['/user', '/admin'] - hides 'user' and 'admin' from breadcrumbs
   */
  excludeSegments?: string[];
  /**
   * Custom className for the breadcrumb container
   */
  className?: string;
}

/**
 * Auto-generates breadcrumbs from the current URL path
 *
 * @example
 * ```tsx
 * <DashboardBreadcrumb excludeSegments={['/user']} />
 * ```
 */
export function DashboardBreadcrumb({ excludeSegments = [], className }: DashboardBreadcrumbProps) {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    const items: Array<{ title: string; href: string; isLast: boolean }> = [];

    // Add home breadcrumb
    items.push({
      title: "Home",
      href: "/",
      isLast: false,
    });

    // Build path progressively
    let currentPath = "";
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === segments.length - 1;

      // Check if this segment should be excluded
      const shouldExclude = excludeSegments.some(exclude => {
        // Check if the exclude path matches exactly or is a prefix
        return currentPath === exclude || currentPath.startsWith(exclude + "/");
      });

      if (!shouldExclude) {
        // Format segment title (capitalize, replace hyphens with spaces)
        const title = segment
          .split("-")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        items.push({
          title,
          href: currentPath,
          isLast,
        });
      }
    });

    return items;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumb if only home is present
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {breadcrumbs.map((item, index) => (
          <div key={item.href} className="flex items-center gap-1.5">
            {index === 0 ? (
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={item.href}>
                    <Home className="h-4 w-4" />
                    <span className="sr-only">Home</span>
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            ) : (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {item.isLast ? (
                    <BreadcrumbPage>{item.title}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={item.href}>{item.title}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </>
            )}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
