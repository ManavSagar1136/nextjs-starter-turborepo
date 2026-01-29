"use client";

import { useMemo } from "react";
import { Filter, Grid3X3, List, Search, X } from "lucide-react";

import { Badge } from "@buildbase/ui/badge";
import { Button } from "@buildbase/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@buildbase/ui/dropdown-menu";
import { Input } from "@buildbase/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@buildbase/ui/toggle-group";
import { cn } from "@buildbase/ui/lib/utils";

import { useMediaLibrary } from "./context";
import { MIME_TYPE_FILTERS } from "./utils";

// ============================================================================
// Types
// ============================================================================

interface SearchAndFiltersProps {
  className?: string;
  /** Show mobile sidebar toggle */
  showMobileSidebarToggle?: boolean;
  onMobileSidebarToggle?: () => void;
}

// ============================================================================
// Tag Filter Pills
// ============================================================================

function TagFilterPills() {
  const { config, tags, selectedTagIds, toggleTagId, setSelectedTagIds } = useMediaLibrary();

  if (!config.enableTags || tags.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.slice(0, 10).map(tag => {
        const isSelected = selectedTagIds.includes(tag.id);
        return (
          <Badge
            key={tag.id}
            variant={isSelected ? "default" : "outline"}
            className={cn("cursor-pointer transition-all hover:opacity-80", isSelected && "pr-1")}
            onClick={() => toggleTagId(tag.id)}
            style={
              tag.color && isSelected
                ? {
                    backgroundColor: tag.color,
                    borderColor: tag.color,
                    color: "white",
                  }
                : tag.color
                  ? {
                      borderColor: tag.color + "60",
                      color: tag.color,
                    }
                  : undefined
            }
          >
            {tag.name}
            {isSelected && <X className="ml-1 h-3 w-3" />}
          </Badge>
        );
      })}

      {selectedTagIds.length > 0 && (
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setSelectedTagIds([])}>
          Clear tags
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// MIME Type Filter
// ============================================================================

function MimeTypeFilter() {
  const { selectedMimeTypes, setSelectedMimeTypes } = useMediaLibrary();

  const toggleMimeType = (value: string) => {
    setSelectedMimeTypes(
      selectedMimeTypes.includes(value) ? selectedMimeTypes.filter(m => m !== value) : [...selectedMimeTypes, value]
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Type
          {selectedMimeTypes.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 justify-center p-0">
              {selectedMimeTypes.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>File Type</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {MIME_TYPE_FILTERS.map(filter => (
          <DropdownMenuCheckboxItem
            key={filter.value}
            checked={selectedMimeTypes.includes(filter.pattern)}
            onCheckedChange={() => toggleMimeType(filter.pattern)}
          >
            {filter.label}
          </DropdownMenuCheckboxItem>
        ))}
        {selectedMimeTypes.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => setSelectedMimeTypes([])}
            >
              Clear filters
            </Button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// View Mode Toggle
// ============================================================================

function ViewModeToggle() {
  const { viewMode, setViewMode } = useMediaLibrary();

  return (
    <ToggleGroup
      type="single"
      value={viewMode}
      onValueChange={(value: string) => value && setViewMode(value as "grid" | "list")}
      className="rounded-md border"
    >
      <ToggleGroupItem value="grid" aria-label="Grid view" className="h-8 w-8 p-0">
        <Grid3X3 className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="List view" className="h-8 w-8 p-0">
        <List className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

// ============================================================================
// Search and Filters Component
// ============================================================================

export function SearchAndFilters({ className, showMobileSidebarToggle, onMobileSidebarToggle }: SearchAndFiltersProps) {
  const { config, searchQuery, setSearchQuery, hasActiveFilters, activeFilterCount, clearFilters } = useMediaLibrary();

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and actions row */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="h-9 pl-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <MimeTypeFilter />
          <ViewModeToggle />

          {/* Clear all filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
              <X className="h-4 w-4" />
              Clear
              <Badge variant="secondary" className="ml-1">
                {activeFilterCount}
              </Badge>
            </Button>
          )}
        </div>
      </div>

      {/* Tag pills row */}
      <TagFilterPills />
    </div>
  );
}
