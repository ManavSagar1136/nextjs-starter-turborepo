"use client";

import { useMemo } from "react";
import { ChevronRight, Home, MoreHorizontal } from "lucide-react";

import { Button } from "@buildbase/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@buildbase/ui/dropdown-menu";
import { cn } from "@buildbase/ui/lib/utils";

import { useMediaLibrary } from "./context";

// ============================================================================
// Types
// ============================================================================

interface BreadcrumbNavProps {
  className?: string;
  /** Maximum items to show before collapsing */
  maxVisibleItems?: number;
}

interface BreadcrumbItem {
  id: string | null;
  name: string;
}

// ============================================================================
// Breadcrumb Item Component
// ============================================================================

function BreadcrumbItemButton({
  item,
  isLast,
  onClick,
}: {
  item: BreadcrumbItem;
  isLast: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "h-7 px-2 text-sm",
        isLast ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
      )}
      onClick={onClick}
    >
      {item.name}
    </Button>
  );
}

// ============================================================================
// Collapsed Items Dropdown
// ============================================================================

function CollapsedItemsDropdown({
  items,
  onNavigate,
}: {
  items: BreadcrumbItem[];
  onNavigate: (id: string | null) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {items.map(item => (
          <DropdownMenuItem key={item.id ?? "root"} onClick={() => onNavigate(item.id)}>
            {item.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// Breadcrumb Separator
// ============================================================================

function BreadcrumbSeparator() {
  return <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />;
}

// ============================================================================
// Breadcrumb Navigation Component
// ============================================================================

export function BreadcrumbNav({ className, maxVisibleItems = 4 }: BreadcrumbNavProps) {
  const { config, currentFolderPath, setSelectedFolderId } = useMediaLibrary();

  // Build full breadcrumb path including root
  const fullPath = useMemo<BreadcrumbItem[]>(() => {
    const root: BreadcrumbItem = { id: null, name: config.labels.allAssets };
    return [root, ...currentFolderPath];
  }, [currentFolderPath, config.labels.allAssets]);

  // Determine which items to show
  const { visibleItems, collapsedItems } = useMemo(() => {
    if (fullPath.length <= maxVisibleItems) {
      return {
        visibleItems: fullPath,
        collapsedItems: [] as BreadcrumbItem[],
      };
    }

    // Always show first and last items, collapse middle ones
    const first = fullPath[0]!; // Safe: fullPath always has at least the root
    const lastItems = fullPath.slice(-(maxVisibleItems - 2));

    return {
      visibleItems: [first, ...lastItems],
      collapsedItems: fullPath.slice(1, -(maxVisibleItems - 2)),
    };
  }, [fullPath, maxVisibleItems]);

  const handleNavigate = (id: string | null) => {
    setSelectedFolderId(id);
  };

  // If only root, don't show breadcrumb
  if (fullPath.length <= 1) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2 font-medium" onClick={() => handleNavigate(null)}>
          <Home className="h-4 w-4" />
          {config.labels.allAssets}
        </Button>
      </div>
    );
  }

  const firstItem = visibleItems[0];
  if (!firstItem) return null;

  return (
    <nav className={cn("flex min-w-0 items-center gap-1", className)} aria-label="Breadcrumb">
      {collapsedItems.length > 0 ? (
        <>
          {/* First item (root) */}
          <BreadcrumbItemButton item={firstItem} isLast={false} onClick={() => handleNavigate(firstItem.id)} />
          <BreadcrumbSeparator />

          {/* Collapsed items dropdown */}
          <CollapsedItemsDropdown items={collapsedItems} onNavigate={handleNavigate} />
          <BreadcrumbSeparator />

          {/* Remaining visible items */}
          {visibleItems.slice(1).map((item, index) => {
            if (!item) return null;
            return (
              <div key={item.id ?? `item-${index}`} className="flex items-center gap-1">
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItemButton
                  item={item}
                  isLast={index === visibleItems.length - 2}
                  onClick={() => handleNavigate(item.id)}
                />
              </div>
            );
          })}
        </>
      ) : (
        // All items visible
        visibleItems.map((item, index) => {
          if (!item) return null;
          return (
            <div key={item.id ?? `item-${index}`} className="flex items-center gap-1">
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItemButton
                item={item}
                isLast={index === visibleItems.length - 1}
                onClick={() => handleNavigate(item.id)}
              />
            </div>
          );
        })
      )}
    </nav>
  );
}
