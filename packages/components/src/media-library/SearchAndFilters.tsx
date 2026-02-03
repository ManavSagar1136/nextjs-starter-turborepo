"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Edit,
  Filter,
  Grid3X3,
  List,
  Plus,
  Search,
  Tag as TagIcon,
  Trash2,
  X,
} from "lucide-react";

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
import { Popover, PopoverContent, PopoverTrigger } from "@buildbase/ui/popover";
import { ScrollArea } from "@buildbase/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@buildbase/ui/toggle-group";
import { cn } from "@buildbase/ui/lib/utils";

import { useMediaLibrary } from "./context";
import type { ITag } from "./types";
import { MIME_TYPE_FILTERS } from "./utils";

// ============================================================================
// Types
// ============================================================================

interface SearchAndFiltersProps {
  className?: string;
  /** Show mobile sidebar toggle */
  showMobileSidebarToggle?: boolean;
  onMobileSidebarToggle?: () => void;
  /** Ref for search input (for keyboard shortcuts) */
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  /** Tag management callbacks */
  onCreateTag?: () => void;
  onEditTag?: (tag: ITag) => void;
  onDeleteTag?: (tag: ITag) => void;
}

// ============================================================================
// Tag Filter Pills
// ============================================================================

interface TagFilterPillsProps {
  onCreateTag?: () => void;
  onEditTag?: (tag: ITag) => void;
  onDeleteTag?: (tag: ITag) => void;
}

function TagFilterPills({ onCreateTag, onEditTag, onDeleteTag }: TagFilterPillsProps) {
  const { config, tags, selectedTagIds, toggleTagId, setSelectedTagIds } = useMediaLibrary();
  const [tagsPopoverOpen, setTagsPopoverOpen] = useState(false);

  if (!config.enableTags) {
    return null;
  }

  return (
    <Popover open={tagsPopoverOpen} onOpenChange={setTagsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <TagIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Tags</span>
          {selectedTagIds.length > 0 && (
            <Badge variant="secondary" className="ml-0.5 h-5 px-1.5 text-xs font-semibold">
              {selectedTagIds.length}
            </Badge>
          )}
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="flex items-center justify-between border-b p-2">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 rounded-md p-1.5">
              <TagIcon className="text-primary h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold tracking-tight">Tags</h3>
            {selectedTagIds.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                {selectedTagIds.length} selected
              </Badge>
            )}
          </div>
          {selectedTagIds.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedTagIds([])}
              className="text-muted-foreground hover:text-foreground h-8 gap-1.5 text-xs"
            >
              Clear
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-2 p-2">
            {/* Create Tag Button */}
            {onCreateTag && (
              <Button
                size="sm"
                variant="outline"
                className="h-9 w-full gap-2 shadow-sm transition-shadow hover:shadow"
                onClick={() => {
                  onCreateTag();
                  setTagsPopoverOpen(false);
                }}
              >
                <Plus className="h-4 w-4" />
                Create Tag
              </Button>
            )}

            {/* Tags List */}
            {tags.length === 0 ? (
              <div className="bg-muted/30 flex flex-col items-center justify-center gap-3 rounded-lg border p-4 py-8 text-center">
                <TagIcon className="text-muted-foreground h-5 w-5" />
                <p className="text-muted-foreground text-sm">No tags found. Create tags to organize your assets.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {tags.map(tag => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <TagItem
                      key={tag.id}
                      tag={tag}
                      isSelected={isSelected}
                      onToggle={() => toggleTagId(tag.id)}
                      onEdit={
                        onEditTag
                          ? () => {
                              onEditTag(tag);
                              setTagsPopoverOpen(false);
                            }
                          : undefined
                      }
                      onDelete={
                        onDeleteTag
                          ? () => {
                              onDeleteTag(tag);
                              setTagsPopoverOpen(false);
                            }
                          : undefined
                      }
                    />
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// Tag Item Component
// ============================================================================

interface TagItemProps {
  tag: ITag;
  isSelected: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

function TagItem({ tag, isSelected, onToggle, onEdit, onDelete }: TagItemProps) {
  return (
    <div
      className={cn(
        "group flex cursor-pointer items-center gap-2.5 rounded-lg border p-2.5 transition-all duration-200",
        isSelected
          ? "bg-primary/10 border-primary shadow-sm"
          : "bg-background border-border hover:bg-accent/50 hover:border-accent-foreground/20"
      )}
      onClick={onToggle}
      tabIndex={0}
      aria-pressed={isSelected}
      role="button"
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      <div
        className={cn(
          "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
          isSelected ? "border-primary bg-primary" : "border-muted-foreground/40 bg-transparent"
        )}
      >
        {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
      </div>
      <span className={cn("flex-1 truncate text-sm font-medium", isSelected ? "text-primary" : "text-foreground")}>
        {tag.name}
      </span>
      {(onEdit || onDelete) && (
        <div
          className="flex items-center gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
          onClick={e => e.stopPropagation()}
        >
          {onEdit && (
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "h-7 w-7 p-0",
                isSelected
                  ? "text-primary hover:bg-primary/20"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              onClick={onEdit}
              tabIndex={-1}
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "h-7 w-7 p-0",
                isSelected ? "text-destructive hover:bg-destructive/20" : "text-destructive hover:bg-destructive/10"
              )}
              onClick={onDelete}
              tabIndex={-1}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
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
// Sort Dropdown
// ============================================================================

function SortDropdown() {
  const { sortBy, sortOrder, setSortBy, setSortOrder } = useMediaLibrary();

  const sortOptions: Array<{ value: "name" | "size" | "createdAt" | "updatedAt" | "contentType"; label: string }> = [
    { value: "name", label: "Name" },
    { value: "size", label: "Size" },
    { value: "createdAt", label: "Date Created" },
    { value: "updatedAt", label: "Date Updated" },
    { value: "contentType", label: "Type" },
  ];

  const currentSortLabel = sortOptions.find(opt => opt.value === sortBy)?.label || "Date Created";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
          <span className="hidden sm:inline">Sort: {currentSortLabel}</span>
          <span className="sm:hidden">Sort</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Sort By</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {sortOptions.map(option => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={sortBy === option.value}
            onCheckedChange={() => setSortBy(option.value)}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Order</DropdownMenuLabel>
        <DropdownMenuCheckboxItem checked={sortOrder === "asc"} onCheckedChange={() => setSortOrder("asc")}>
          Ascending
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={sortOrder === "desc"} onCheckedChange={() => setSortOrder("desc")}>
          Descending
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// Search and Filters Component
// ============================================================================

export function SearchAndFilters({
  className,
  showMobileSidebarToggle,
  onMobileSidebarToggle,
  searchInputRef,
  onCreateTag,
  onEditTag,
  onDeleteTag,
}: SearchAndFiltersProps) {
  const { config, searchQuery, setSearchQuery, hasActiveFilters, activeFilterCount, clearFilters } = useMediaLibrary();

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and actions row */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            ref={searchInputRef}
            type="search"
            placeholder="Search assets... (Ctrl/Cmd + K)"
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
          <SortDropdown />
          <MimeTypeFilter />
          {config.enableTags && (
            <TagFilterPills onCreateTag={onCreateTag} onEditTag={onEditTag} onDeleteTag={onDeleteTag} />
          )}
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
    </div>
  );
}
