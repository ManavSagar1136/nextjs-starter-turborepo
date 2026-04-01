"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Routes } from "@/data/routes";
import { ChevronDown, ChevronRight, FileText, Folder } from "lucide-react";

import { IDocPost } from "@/services/docs";
import { computeDocUrl } from "@/lib/docs/doc-url.service";

import { Button } from "@buildbase/ui/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@buildbase/ui/components/ui/collapsible";

import { cn } from "@buildbase/ui/lib/utils";

/**
 * `DocItem` structure defines the shape for navigation items
 * that are rendered in the sidebar. They may represent
 * folders (with children) or direct document links.
 */
interface DocItem {
  title: string;
  href: string;
  items?: DocItem[];
}

/**
 * Props for the DocNavigation component.
 * - `items`: Flat array of IDocPost (as retrieved from the API)
 * - `className`: Optional additional CSS classes for the nav wrapper
 */
interface DocNavigationProps {
  items: IDocPost[];
  className?: string;
}

/**
 * buildDocNavigation
 *
 * Transforms a flat array of docs (from API) into a structured navigation tree,
 * grouping them by folder (if present), and sorting by order.
 *
 * @param docs Raw documentation list from API (array of IDocPost, possibly with folder info)
 * @returns DocItem[] - structured navigation data for rendering
 */
function buildDocNavigation(docs: any[]): DocItem[] {
  const navigation: DocItem[] = [];
  const folderMap = new Map<string, { folder: any; docs: any[] }>();
  const rootDocs: any[] = [];

  // Group docs by folder, or add to root if not in a folder
  docs.forEach((doc) => {
    if (doc.folder?.path) {
      const folderPath = doc.folder.path;
      if (!folderMap.has(folderPath)) {
        folderMap.set(folderPath, {
          folder: doc.folder,
          docs: [],
        });
      }
      folderMap.get(folderPath)!.docs.push(doc);
    } else {
      rootDocs.push(doc);
    }
  });

  // Convert each folder group into a DocItem, sorting docs within
  folderMap.forEach(({ folder, docs: folderDocs }) => {
    const sortedDocs = folderDocs.sort(
      (a, b) => (a.order || 0) - (b.order || 0),
    );

    navigation.push({
      title: folder.name,
      href: `${Routes.docs}/${folder.path}`,
      items: sortedDocs.map((doc) => ({
        title: doc.title,
        href: doc.url || computeDocUrl(doc),
      })),
    });
  });

  // Handle root-level docs (not associated with a folder)
  const sortedRootDocs = rootDocs.sort(
    (a, b) => (a.order || 0) - (b.order || 0),
  );
  sortedRootDocs.forEach((doc) => {
    navigation.push({
      title: doc.title,
      href: doc.url || computeDocUrl(doc),
    });
  });

  return navigation;
}

/**
 * DocNavItem
 *
 * Renders a single navigation item (either a direct doc link or a collapsible folder).
 * If the item has children, renders a collapsible with folder icon,
 * otherwise just renders a link to the documentation page.
 *
 * Highlights the currently active item based on the URL pathname.
 *
 * Props:
 * - item: The navigation item to render.
 * - level: The nesting level (root = 0, folders' children = 1, etc.)
 */
function DocNavItem({ item, level = 0 }: { item: DocItem; level?: number }) {
  const pathname = usePathname();
  const isActive = pathname === item.href;
  const hasChildren = item.items && item.items.length > 0;
  const [isOpen, setIsOpen] = useState(isActive || level === 0);

  // Render folder with collapsible children
  if (hasChildren) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-between p-2 h-auto font-normal",
              "hover:bg-accent hover:text-accent-foreground",
              level > 0 && "pl-4",
            )}
          >
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4" />
              <span>{item.title}</span>
            </div>
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1">
          {item.items?.map((child, index) => (
            <DocNavItem key={index} item={child} level={level + 1} />
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  // Render a single document link (leaf node)
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2 p-2 rounded-md text-sm transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        isActive
          ? "bg-accent text-accent-foreground font-medium"
          : "text-slate-400 dark:text-slate-600",
        level > 0 && "pl-4",
      )}
    >
      <FileText className="h-4 w-4" />
      <span>{item.title}</span>
    </Link>
  );
}

/**
 * DocNavigation
 *
 * Main sidebar navigation component for documentation.
 * Accepts a flat list of doc objects from API and displays
 * them in a folder structure, allowing for navigation.
 *
 * @param items Array of IDocPost from API
 * @param className Optional CSS classes for the container
 */
export function DocNavigation({ items, className }: DocNavigationProps) {
  // Build navigation tree structure from flat doc list
  const navigationItems = buildDocNavigation(items);

  return (
    <nav
      className={cn("space-y-1", className)}
      aria-label="Documentation navigation"
    >
      {navigationItems.map((item, index) => (
        <DocNavItem key={index} item={item} />
      ))}
    </nav>
  );
}
