"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from "@buildbase/ui/components/ui/sheet";

import { TOCItem } from "@/lib/toc";
import { cn } from "@buildbase/ui/lib/utils";

import { Button } from "@buildbase/ui/components/ui/button";
import { ScrollArea } from "@buildbase/ui/components/ui/scroll-area";

export const TOC_ATTRIBUTES = {
  EXCLUDE: "data-toc-exclude",
};

/**
 * Strips markdown/MDX syntax from text and returns plain string
 * Removes:
 * - Bold/italic: **text**, *text*, __text__, _text_
 * - Links: [text](url) -> text
 * - Code: `code` -> code
 * - Strikethrough: ~~text~~ -> text
 * - Any other markdown syntax
 */
const stripMarkdownSyntax = (text: string): string => {
  if (!text) return "";

  let cleaned = text;

  // Remove markdown links: [text](url) -> text
  // Handles cases like: [](url)text -> text
  cleaned = cleaned.replace(/\[([^\]]*)\]\([^)]+\)/g, "$1");

  // Remove bold: **text** or __text__ -> text
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, "$1");
  cleaned = cleaned.replace(/__([^_]+)__/g, "$1");

  // Remove italic: *text* or _text_ -> text
  // Use word boundaries to avoid removing single asterisks/underscores in the middle of words
  cleaned = cleaned.replace(/\*([^*\s][^*]*[^*\s])\*/g, "$1");
  cleaned = cleaned.replace(/\*([^*\s])\*/g, "$1"); // Single character italic
  cleaned = cleaned.replace(/_([^_\s][^_]*[^_\s])_/g, "$1");
  cleaned = cleaned.replace(/_([^_\s])_/g, "$1"); // Single character italic

  // Remove code: `code` -> code
  cleaned = cleaned.replace(/`([^`]+)`/g, "$1");

  // Remove strikethrough: ~~text~~ -> text
  cleaned = cleaned.replace(/~~([^~]+)~~/g, "$1");

  // Remove inline code blocks: ```code``` -> code
  cleaned = cleaned.replace(/```([^`]+)```/g, "$1");

  // Remove images: ![alt](url) -> alt
  cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1");

  // Remove HTML tags if any
  cleaned = cleaned.replace(/<[^>]+>/g, "");

  // Remove any remaining markdown header syntax: # text -> text
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, "");

  // Clean up multiple spaces and trim
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned;
};

interface TableOfContentsProps {
  items: TOCItem[];
  className?: string;
  classNames?: {
    scrollArea?: string;
  };
  onItemClick?: (item: TOCItem) => void;
}

export function TableOfContents({ items, className, classNames, onItemClick }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [manualOverride, setManualOverride] = useState<string>("");

  useEffect(() => {
    // Calculate header height dynamically
    const header = document.querySelector('header, [role="banner"], .header, #header');
    const headerHeight = header ? header.getBoundingClientRect().height : 80; // fallback to 80px

    // Add IDs to headings if they don't exist (excluding headings with data-toc-exclude)
    const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6")).filter(
      heading => !heading.hasAttribute(TOC_ATTRIBUTES.EXCLUDE)
    );
    headings.forEach(heading => {
      if (!heading.id) {
        const text = heading.textContent || "";
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        heading.id = id;
      }
    });

    const observer = new IntersectionObserver(
      entries => {
        // Skip auto-detection if there's a manual override
        if (manualOverride) {
          return;
        }

        // Find the most visible heading
        let mostVisibleHeading: Element | null = null;
        let maxVisibility = 0;

        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const visibility = entry.intersectionRatio;
            if (visibility > maxVisibility) {
              maxVisibility = visibility;
              mostVisibleHeading = entry.target;
            }
          }
        });

        if (mostVisibleHeading) {
          const headingElement = mostVisibleHeading as HTMLElement;
          // console.log(
          //   "Setting active ID:",
          //   headingElement.id,
          //   "visibility:",
          //   maxVisibility,
          // );
          setActiveId(headingElement.id);
        }
      },
      {
        rootMargin: `-${headerHeight}px 0% -60% 0%`,
        // rootMargin: `-${headerHeight + 20}px 0% -60% 0%`,
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    headings.forEach(heading => {
      // console.log("Observing heading:", heading.id, heading.textContent);
      observer.observe(heading);
    });

    return () => observer.disconnect();
  }, [items, manualOverride]); // Re-run when items change or manual override changes

  // Clear manual override after a delay
  useEffect(() => {
    if (manualOverride) {
      const timeout = setTimeout(() => {
        setManualOverride("");
      }, 1000); // 1 second delay
      return () => clearTimeout(timeout);
    }
  }, [manualOverride]);

  // Debug logging
  // useEffect(() => {
  //   console.log("TableOfContents items:", items);
  //   console.log("Active ID:", activeId);
  //   console.log("Manual Override:", manualOverride);
  // }, [items, activeId, manualOverride]);

  if (!items || items.length === 0) {
    // console.log("No TOC items found");
    return null;
  }

  const scrollToHeading = (id: string, item: TOCItem) => {
    // Set manual override to prevent auto-detection from overriding
    setManualOverride(id);
    setActiveId(id);

    // Try to find the element by ID first, but prefer non-excluded headings
    // If multiple elements have the same ID, getElementById returns the first one
    // So we need to check all elements with this ID and prefer the non-excluded one
    let element = document.getElementById(id);
    if (element && element.hasAttribute(TOC_ATTRIBUTES.EXCLUDE)) {
      // If the found element is excluded, search for all elements with this ID
      const allElementsWithId = Array.from(document.querySelectorAll(`[id="${id}"]`));
      element = (allElementsWithId.find(el => !el.hasAttribute(TOC_ATTRIBUTES.EXCLUDE)) as HTMLElement) || null;
    }

    // If not found, try to find by text content (fallback, excluding headings with data-toc-exclude)
    if (!element) {
      const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6")).filter(
        heading => !heading.hasAttribute(TOC_ATTRIBUTES.EXCLUDE)
      );
      element = headings.find(heading => {
        const headingText = heading.textContent?.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        return headingText === id || heading.id === id;
      }) as HTMLElement;
    }

    // Final check: ensure the found element is not excluded
    if (element && element.hasAttribute(TOC_ATTRIBUTES.EXCLUDE)) {
      element = null;
    }

    if (element) {
      onItemClick?.(item);
      // console.log(`Scrolling to heading: ${id}`, element);
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } else {
      // console.warn(
      //   `Heading with id "${id}" not found. Available headings:`,
      //   Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6")).map(
      //     (h) => ({
      //       id: h.id,
      //       text: h.textContent,
      //       tagName: h.tagName,
      //     }),
      //   ),
      // );
    }
  };

  return (
    <ScrollArea className={cn("max-h-[calc(100vh-var(--header-height)-2rem)]", classNames?.scrollArea)}>
      <nav className={cn("scroll-parent space-y-1", className)} aria-label="Table of contents">
        {/* Header */}
        <div className="border-border/50 mb-4 border-b pb-3">
          <h3 className="text-muted-foreground px-3 text-xs font-semibold uppercase tracking-wider">On This Page</h3>
        </div>
        <ul className="space-y-1">
          {items.map((item, index) => {
            const isActive = activeId === item.id;
            const prevItem = index > 0 ? items[index - 1] : null;
            const nextItem = index < items.length - 1 ? items[index + 1] : null;
            const isFirstOfLevel = !prevItem || prevItem.level >= item.level;
            const hasChildren = nextItem && nextItem.level > item.level;

            // Progressive left padding for hierarchy - more visible differences
            const paddingMap = {
              1: "pl-3", // Level 1: minimal padding
              2: "pl-6", // Level 2: +3 (12px)
              3: "pl-10", // Level 3: +4 (16px more)
              4: "pl-14", // Level 4: +4 (16px more)
              5: "pl-18", // Level 5: +4 (16px more)
              6: "pl-22", // Level 6: +4 (16px more)
            };

            const levelStyles = {
              1: "text-sm font-semibold py-2.5",
              2: "text-sm font-medium py-2",
              3: "text-xs font-normal py-1.5",
              4: "text-xs font-normal py-1.5",
              5: "text-xs font-normal py-1",
              6: "text-xs font-normal py-1",
            };

            const mainText = stripMarkdownSyntax(item.text);

            return (
              <li
                key={`${item.id}-${index}`}
                className={cn(
                  "relative",
                  // Add spacing for top-level items
                  item.level === 1 && index > 0 && "mt-2",
                  // Group nested items visually
                  item.level > 1 && isFirstOfLevel && "mt-1"
                )}
              >
                <button
                  onClick={() => scrollToHeading(item.id, item)}
                  onKeyDown={e => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      scrollToHeading(item.id, item);
                    }
                  }}
                  tabIndex={0}
                  aria-label={`Navigate to ${mainText}`}
                  aria-current={isActive ? "location" : undefined}
                  className={cn(
                    "group relative w-full rounded-md text-left transition-all duration-200",
                    "focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                    // Apply progressive left padding based on level
                    paddingMap[item.level as keyof typeof paddingMap] || "pl-3",
                    // Right padding for all items
                    "pr-3",
                    levelStyles[item.level as keyof typeof levelStyles] || "py-2 text-sm",
                    // Active state
                    isActive
                      ? "text-primary bg-primary/10 dark:bg-primary/20 border-primary border-l-[3px] shadow-sm"
                      : "text-muted-foreground",
                    // Hover state (only when not active)
                    !isActive && "hover:text-foreground hover:bg-accent/50 dark:hover:bg-accent/30",
                    // Visual hierarchy indicator for nested items (subtle left border)
                    item.level > 1 && !isActive && "hover:border-primary/20 border-l border-transparent"
                  )}
                >
                  <span
                    className={cn(
                      "block truncate leading-relaxed",
                      isActive && "font-medium",
                      item.level === 1 && "font-semibold"
                    )}
                  >
                    {mainText}
                  </span>
                  {/* Active indicator - positioned relative to left padding */}
                  {isActive && (
                    <span
                      className={cn(
                        "bg-primary absolute top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full opacity-80",
                        // Position based on level to account for padding
                        item.level === 1 ? "left-0" : "left-0"
                      )}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </ScrollArea>
  );
}

export function TableOfContentsSheet({
  items,
  open,
  onOpenChange,
  classNames,
  ...sheetProps
}: {
  items: TOCItem[];
  classNames?: {
    content?: string;
  } & TableOfContentsProps["classNames"];
} & React.ComponentProps<typeof Sheet>) {
  return (
    <Sheet {...sheetProps} open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80 gap-0 p-0 sm:w-96">
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 border-b p-4 py-2">
          <SheetTitle className="flex-1 text-start">Table of Contents</SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost">
              <X />
            </Button>
          </SheetClose>
        </SheetHeader>
        <div className="scroll-parent">
          <TableOfContents
            key={`toc-mobile-${items.length}`}
            items={items}
            className="w-80 p-4 sm:w-96"
            classNames={{
              scrollArea: cn("max-h-full", classNames?.scrollArea),
            }}
            onItemClick={() => onOpenChange?.(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
