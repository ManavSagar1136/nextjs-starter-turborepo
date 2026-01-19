"use client";

import { useCallback, useMemo } from "react";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { cn } from "@buildbase/ui/lib/utils";

/**
 * Generates an array of page numbers to display in pagination
 * @param currentPage - The current active page (1-indexed)
 * @param totalPages - Total number of pages
 * @param maxVisible - Maximum number of page buttons to show (default: 5)
 * @returns Array of page numbers or "ellipsis" strings
 */
export const generatePageNumbers = (
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5,
): (number | "ellipsis")[] => {
  // Validate inputs
  if (totalPages <= 0) return [];
  if (currentPage < 1) return [];
  if (currentPage > totalPages) return [];

  const pages: (number | "ellipsis")[] = [];

  // If total pages is less than or equal to maxVisible, show all pages
  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Current page is near the start
  if (currentPage <= 3) {
    for (let i = 1; i <= 4; i++) {
      pages.push(i);
    }
    pages.push("ellipsis");
    pages.push(totalPages);
  }
  // Current page is near the end
  else if (currentPage >= totalPages - 2) {
    pages.push(1);
    pages.push("ellipsis");
    for (let i = totalPages - 3; i <= totalPages; i++) {
      pages.push(i);
    }
  }
  // Current page is in the middle
  else {
    pages.push(1);
    pages.push("ellipsis");
    for (let i = currentPage - 1; i <= currentPage + 1; i++) {
      pages.push(i);
    }
    pages.push("ellipsis");
    pages.push(totalPages);
  }

  return pages;
};

/**
 * Props for the PaginationControls component.
 */
export interface IPaginationControlsProps {
  /**
   * Current active page (1-indexed)
   */
  currentPage: number;
  /**
   * Total number of pages
   */
  totalPages: number;
  /**
   * Callback function called when page changes
   * @param page - The new page number (1-indexed)
   */
  onPageChange: (page: number) => void;
  /**
   * Maximum number of page buttons to show (default: 5)
   */
  maxVisible?: number;
  /**
   * Custom className for the pagination container
   */
  className?: string;
  /**
   * Custom className for pagination content
   */
  contentClassName?: string;
  /**
   * Show pagination even when there's only 1 page (default: false)
   */
  showOnSinglePage?: boolean;
  /**
   * Custom labels for previous/next buttons
   */
  labels?: {
    previous?: string;
    next?: string;
  };
  /**
   * Scroll to top on page change (default: false)
   */
  scrollToTop?: boolean;
  /**
   * Custom scroll behavior options
   */
  scrollOptions?: ScrollToOptions;
}

/**
 * PaginationControls component for paginated navigation (Next.js/React).
 *
 * @see {@link IPaginationControlsProps} for all props.
 */
const PaginationControls = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisible = 5,
  className,
  contentClassName,
  showOnSinglePage = false,
  labels,
  scrollToTop = false,
  scrollOptions = { top: 0, behavior: "smooth" },
}: IPaginationControlsProps) => {
  // Validate inputs
  const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages));
  const validTotalPages = Math.max(0, totalPages);

  // Generate page numbers to display
  const pageNumbers = useMemo(
    () => generatePageNumbers(validCurrentPage, validTotalPages, maxVisible),
    [validCurrentPage, validTotalPages, maxVisible],
  );

  // Handle page change with optional scroll-to-top
  const handlePageChange = useCallback(
    (page: number) => {
      if (page < 1 || page > validTotalPages || page === validCurrentPage) {
        return;
      }
      onPageChange(page);
      if (scrollToTop && typeof window !== "undefined") {
        window.scrollTo(scrollOptions);
      }
    },
    [
      onPageChange,
      scrollToTop,
      scrollOptions,
      validCurrentPage,
      validTotalPages,
    ],
  );

  // Early return if there are no pages or only one page and showOnSinglePage is false
  if (validTotalPages === 0 || (validTotalPages === 1 && !showOnSinglePage)) {
    return null;
  }

  const hasPreviousPage = validCurrentPage > 1;
  const hasNextPage = validCurrentPage < validTotalPages;

  return (
    <Pagination className={className}>
      <PaginationContent className={contentClassName}>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (hasPreviousPage) {
                handlePageChange(validCurrentPage - 1);
              }
            }}
            className={cn(!hasPreviousPage && "pointer-events-none opacity-50")}
            aria-disabled={!hasPreviousPage}
          >
            {labels?.previous || "Previous"}
          </PaginationPrevious>
        </PaginationItem>

        {pageNumbers.map((page, index) => (
          <PaginationItem key={`${page}-${index}`}>
            {page === "ellipsis" ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(page);
                }}
                isActive={validCurrentPage === page}
                aria-label={`Go to page ${page}`}
                aria-current={validCurrentPage === page ? "page" : undefined}
              >
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (hasNextPage) {
                handlePageChange(validCurrentPage + 1);
              }
            }}
            className={cn(!hasNextPage && "pointer-events-none opacity-50")}
            aria-disabled={!hasNextPage}
          >
            {labels?.next || "Next"}
          </PaginationNext>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

PaginationControls.displayName = "ReusablePagination";

export default PaginationControls;
