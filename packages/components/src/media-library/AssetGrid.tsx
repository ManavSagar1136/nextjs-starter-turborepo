"use client";

import { File, Loader2 } from "lucide-react";

import { Button } from "@buildbase/ui/button";
import { cn } from "@buildbase/ui/lib/utils";

import { AssetCard, AssetListItem } from "./AssetCard";
import { useMediaLibrary } from "./context";

// ============================================================================
// Types
// ============================================================================

interface AssetGridProps {
  className?: string;
  /** Ref for the scroll container (for scroll-to-top on page change) */
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function AssetGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border-border bg-card overflow-hidden rounded-lg border shadow-sm">
          <div className="animate-pulse">
            <div className="from-muted to-muted/50 aspect-square bg-gradient-to-br" />
            <div className="space-y-2 p-4">
              <div className="bg-muted h-4 w-3/4 rounded" />
              <div className="bg-muted h-3 w-1/2 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Empty State
// ============================================================================

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  const { config, clearFilters } = useMediaLibrary();

  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
        <File className="text-muted-foreground h-8 w-8" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">
        {hasFilters ? "No assets match your filters" : config.labels.noAssets}
      </h3>
      <p className="text-muted-foreground mb-4 max-w-md">
        {hasFilters
          ? "Try adjusting your filters or search to see more assets."
          : "Upload your first asset to begin building your media library."}
      </p>
      {hasFilters && (
        <Button variant="outline" onClick={clearFilters}>
          Clear Filters
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// Error State
// ============================================================================

function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="bg-destructive/10 mb-4 flex h-16 w-16 items-center justify-center rounded-full">
        <File className="text-destructive h-8 w-8" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">Failed to load assets</h3>
      <p className="text-muted-foreground mb-4 max-w-md">
        We were unable to fetch the assets. Please check your network connection or try again.
      </p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// Pagination
// ============================================================================

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalDocs: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

function Pagination({ currentPage, totalPages, totalDocs, pageSize, onPageChange }: PaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalDocs);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const showEllipsisStart = currentPage > 3;
    const showEllipsisEnd = currentPage < totalPages - 2;

    if (totalPages <= 7) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (showEllipsisStart) {
        pages.push("ellipsis");
      }

      // Show pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (showEllipsisEnd) {
        pages.push("ellipsis");
      }

      // Always show last page
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
      <div className="text-muted-foreground text-sm">
        Showing <span className="text-foreground font-semibold">{startItem}</span> to{" "}
        <span className="text-foreground font-semibold">{endItem}</span> of{" "}
        <span className="text-foreground font-semibold">{totalDocs}</span> assets
      </div>

      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
          Previous
        </Button>

        <div className="mx-2 hidden items-center gap-1 sm:flex">
          {getPageNumbers().map((page, i) =>
            page === "ellipsis" ? (
              <span key={`ellipsis-${i}`} className="text-muted-foreground px-2">
                ...
              </span>
            ) : (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                className="w-9"
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            )
          )}
        </div>

        <span className="text-muted-foreground mx-2 text-sm sm:hidden">
          Page {currentPage} of {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Asset Grid Component
// ============================================================================

export function AssetGrid({ className, scrollContainerRef }: AssetGridProps) {
  const { config, assets, isLoadingAssets, viewMode, currentPage, setCurrentPage, hasActiveFilters, refreshAssets } =
    useMediaLibrary();

  // Loading state
  if (isLoadingAssets && !assets) {
    return (
      <div className={cn("p-6", className)}>
        <AssetGridSkeleton count={config.pageSize} />
      </div>
    );
  }

  // Empty state
  if (!assets || assets.docs.length === 0) {
    return (
      <div className={cn("p-6", className)}>
        <EmptyState hasFilters={hasActiveFilters} />
      </div>
    );
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page);

    // Scroll to top
    if (scrollContainerRef?.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className={cn("p-6", className)} role="region" aria-label="Asset library">
      {/* Loading overlay */}
      {isLoadingAssets && (
        <div className="mb-4 flex items-center justify-center py-4" role="status" aria-live="polite">
          <Loader2 className="text-muted-foreground mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
          <span className="text-muted-foreground text-sm">Loading assets...</span>
        </div>
      )}

      {/* Asset Grid/List */}
      {viewMode === "list" ? (
        <ul className="space-y-2" role="list">
          {assets.docs.map(asset => (
            <li key={asset.id} role="listitem">
              <AssetListItem asset={asset} />
            </li>
          ))}
        </ul>
      ) : (
        <div
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
          role="list"
          aria-label="Asset grid"
        >
          {assets.docs.map(asset => (
            <div key={asset.id} role="listitem">
              <AssetCard asset={asset} />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {assets.totalDocs > 0 && assets.totalPages > 1 && (
        <div className="border-border mt-8 border-t pt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={assets.totalPages}
            totalDocs={assets.totalDocs}
            pageSize={config.pageSize}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
