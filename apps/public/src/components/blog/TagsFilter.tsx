"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Tag as TagIcon } from "lucide-react";

import { IBlogTag } from "@/services/blogs";

import { Badge } from "@buildbase/ui/components/ui/badge";
import { Button } from "@buildbase/ui/components/ui/button";
import { Card } from "@buildbase/ui/components/ui/card";

import { cn } from "@buildbase/ui/lib/utils";

interface TagsFilterProps {
  allTags: IBlogTag[];
  selectedTags: string[];
  onTagToggle: (tagSlug: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

// Estimate: ~8-10 tags per row on average, so 2 rows = ~16-20 tags
const TAGS_PER_ROW_ESTIMATE = 14;
const MAX_ROWS = 2;
const INITIAL_TAGS_TO_SHOW = TAGS_PER_ROW_ESTIMATE * MAX_ROWS;

const TagsFilter = ({
  allTags,
  selectedTags,
  onTagToggle,
  onClearFilters,
  hasActiveFilters,
}: TagsFilterProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const shouldShowExpandButton = allTags.length > INITIAL_TAGS_TO_SHOW;
  const tagsToDisplay = useMemo(() => {
    if (isExpanded || !shouldShowExpandButton) {
      return allTags;
    }
    return allTags.slice(0, INITIAL_TAGS_TO_SHOW);
  }, [allTags, isExpanded, shouldShowExpandButton]);

  const handleToggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <Card className="p-2.5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <TagIcon className="h-3.5 w-3.5" />
          Filter by Tags{" "}
          {allTags.length > 0 && (
            <Badge variant="secondary" className="text-xs py-1 px-2">
              {allTags.length}
            </Badge>
          )}
        </h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-xs h-7 px-2"
          >
            Clear All
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tagsToDisplay.map((tag) => (
          <Badge
            key={tag.id}
            variant={selectedTags.includes(tag.slug) ? "default" : "outline"}
            className={cn(
              "cursor-pointer transition-all text-xs py-1 px-2 dark:border-white/20",
              selectedTags.includes(tag.slug) &&
                "bg-primary text-primary-foreground",
            )}
            onClick={() => onTagToggle(tag.slug)}
          >
            {tag.title}
          </Badge>
        ))}
      </div>
      {shouldShowExpandButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleExpand}
          className="w-full mt-2 text-xs h-7"
        >
          {isExpanded ? (
            <>
              Show Less
              <ChevronUp className="h-3.5 w-3.5 ml-1" />
            </>
          ) : (
            <>
              Show All Tags ({allTags.length - INITIAL_TAGS_TO_SHOW} more)
              <ChevronDown className="h-3.5 w-3.5 ml-1" />
            </>
          )}
        </Button>
      )}
    </Card>
  );
};

export default TagsFilter;
