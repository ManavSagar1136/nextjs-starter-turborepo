"use client";

import { useMemo } from "react";

/**
 * Hook to calculate virtual scrolling configuration
 * Returns item sizes and column counts based on view mode and container width
 */
export function useVirtualScrolling(
  viewMode: "grid" | "list",
  containerWidth: number,
  enableVirtualScrolling: boolean = true
) {
  return useMemo(() => {
    if (!enableVirtualScrolling || containerWidth === 0) {
      return {
        enabled: false,
        itemWidth: 0,
        itemHeight: 0,
        columns: 1,
        rowHeight: 0,
      };
    }

    // Grid view configuration
    if (viewMode === "grid") {
      // Calculate columns based on container width (matching Tailwind breakpoints)
      let columns = 1;
      if (containerWidth >= 1536) {
        columns = 5; // 2xl
      } else if (containerWidth >= 1280) {
        columns = 4; // xl
      } else if (containerWidth >= 1024) {
        columns = 3; // lg
      } else if (containerWidth >= 640) {
        columns = 2; // sm
      }

      // Card dimensions: aspect-square with padding and gap
      const gap = 20; // gap-5 = 1.25rem = 20px
      const padding = 24; // p-6 = 1.5rem = 24px
      const availableWidth = containerWidth - padding * 2;
      const itemWidth = Math.floor((availableWidth - gap * (columns - 1)) / columns);
      const itemHeight = itemWidth + 80; // Card height = width + header/footer space

      return {
        enabled: true,
        itemWidth,
        itemHeight,
        columns,
        rowHeight: itemHeight + gap,
      };
    }

    // List view configuration
    return {
      enabled: true,
      itemWidth: containerWidth,
      itemHeight: 0, // Not used in list view
      columns: 1,
      rowHeight: 80, // Fixed height for list items
    };
  }, [viewMode, containerWidth, enableVirtualScrolling]);
}
