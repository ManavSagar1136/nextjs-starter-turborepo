import * as React from "react";
import { Search as SearchIcon, X, Filter, SortAsc, SortDesc } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface SearchFilter {
  key: string;
  label: string;
  type: "select" | "multiselect" | "date" | "range";
  options?: { value: string; label: string }[];
  value?: any;
}

export interface SearchSort {
  key: string;
  label: string;
  direction: "asc" | "desc";
}

export interface SearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  filters?: SearchFilter[];
  onFilterChange?: (filters: SearchFilter[]) => void;
  sortOptions?: SearchSort[];
  onSortChange?: (sort: SearchSort) => void;
  resultsCount?: number;
  className?: string;
  variant?: "default" | "minimal" | "advanced";
}

export function Search({
  query,
  onQueryChange,
  onSearch,
  placeholder = "Search...",
  filters = [],
  onFilterChange,
  sortOptions = [],
  onSortChange,
  resultsCount,
  className,
  variant = "default",
}: SearchProps) {
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [activeFilters, setActiveFilters] = React.useState<SearchFilter[]>(filters);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query);
  };

  const handleFilterChange = (filterKey: string, value: any) => {
    const updatedFilters = activeFilters.map(filter => (filter.key === filterKey ? { ...filter, value } : filter));
    setActiveFilters(updatedFilters);
    onFilterChange?.(updatedFilters);
  };

  const clearFilters = () => {
    const clearedFilters = activeFilters.map(filter => ({
      ...filter,
      value: undefined,
    }));
    setActiveFilters(clearedFilters);
    onFilterChange?.(clearedFilters);
  };

  const getActiveFiltersCount = () => {
    return activeFilters.filter(filter => filter.value !== undefined && filter.value !== "").length;
  };

  const renderFilter = (filter: SearchFilter) => {
    switch (filter.type) {
      case "select":
        return (
          <div key={filter.key} className="space-y-2">
            <label className="text-sm font-medium">{filter.label}</label>
            <select
              value={filter.value || ""}
              onChange={e => handleFilterChange(filter.key, e.target.value)}
              className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {filter.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );

      case "multiselect":
        return (
          <div key={filter.key} className="space-y-2">
            <label className="text-sm font-medium">{filter.label}</label>
            <div className="space-y-2">
              {filter.options?.map(option => (
                <label key={option.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filter.value?.includes(option.value) || false}
                    onChange={e => {
                      const currentValues = filter.value || [];
                      const newValues = e.target.checked
                        ? [...currentValues, option.value]
                        : currentValues.filter((v: string) => v !== option.value);
                      handleFilterChange(filter.key, newValues);
                    }}
                    className="border-input rounded"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case "date":
        return (
          <div key={filter.key} className="space-y-2">
            <label className="text-sm font-medium">{filter.label}</label>
            <input
              type="date"
              value={filter.value || ""}
              onChange={e => handleFilterChange(filter.key, e.target.value)}
              className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
        );

      case "range":
        return (
          <div key={filter.key} className="space-y-2">
            <label className="text-sm font-medium">{filter.label}</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filter.value?.min || ""}
                onChange={e =>
                  handleFilterChange(filter.key, {
                    ...filter.value,
                    min: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Max"
                value={filter.value?.max || ""}
                onChange={e =>
                  handleFilterChange(filter.key, {
                    ...filter.value,
                    max: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (variant === "minimal") {
    return (
      <div className={cn("relative", className)}>
        <form onSubmit={handleSearch} className="relative">
          <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder={placeholder}
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            className="pr-10 pl-10"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2 p-0"
              onClick={() => onQueryChange("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </form>
      </div>
    );
  }

  if (variant === "advanced") {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative">
          <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder={placeholder}
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            className="pr-20 pl-10"
          />
          <div className="absolute top-1/2 right-2 flex -translate-y-1/2 gap-1">
            {query && (
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onQueryChange("")}>
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button type="submit" size="sm">
              Search
            </Button>
          </div>
        </form>

        {/* Filters and Sort */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                  {getActiveFiltersCount() > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {getActiveFiltersCount()}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Filters</h4>
                    {getActiveFiltersCount() > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        Clear all
                      </Button>
                    )}
                  </div>
                  <div className="space-y-4">{activeFilters.map(renderFilter)}</div>
                </div>
              </PopoverContent>
            </Popover>

            {getActiveFiltersCount() > 0 && (
              <div className="flex flex-wrap gap-1">
                {activeFilters
                  .filter(filter => filter.value !== undefined && filter.value !== "")
                  .map(filter => (
                    <Badge key={filter.key} variant="secondary" className="text-xs">
                      {filter.label}: {Array.isArray(filter.value) ? filter.value.join(", ") : filter.value}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-1 h-4 w-4 p-0"
                        onClick={() => handleFilterChange(filter.key, undefined)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
              </div>
            )}
          </div>

          {sortOptions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <SortAsc className="mr-2 h-4 w-4" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {sortOptions.map(option => (
                  <DropdownMenuItem key={option.key} onClick={() => onSortChange?.(option)}>
                    {option.label}
                    {option.direction === "asc" ? (
                      <SortAsc className="ml-2 h-4 w-4" />
                    ) : (
                      <SortDesc className="ml-2 h-4 w-4" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Results Count */}
        {resultsCount !== undefined && (
          <p className="text-muted-foreground text-sm">
            {resultsCount} result{resultsCount !== 1 ? "s" : ""} found
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          className="pr-10 pl-10"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2 p-0"
            onClick={() => onQueryChange("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </form>

      {/* Filters */}
      {filters.length > 0 && (
        <div className="flex items-center gap-2">
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {getActiveFiltersCount() > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {getActiveFiltersCount()}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filters</h4>
                  {getActiveFiltersCount() > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear all
                    </Button>
                  )}
                </div>
                <div className="space-y-4">{activeFilters.map(renderFilter)}</div>
              </div>
            </PopoverContent>
          </Popover>

          {getActiveFiltersCount() > 0 && (
            <div className="flex flex-wrap gap-1">
              {activeFilters
                .filter(filter => filter.value !== undefined && filter.value !== "")
                .map(filter => (
                  <Badge key={filter.key} variant="secondary" className="text-xs">
                    {filter.label}: {Array.isArray(filter.value) ? filter.value.join(", ") : filter.value}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-4 w-4 p-0"
                      onClick={() => handleFilterChange(filter.key, undefined)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Results Count */}
      {resultsCount !== undefined && (
        <p className="text-muted-foreground text-sm">
          {resultsCount} result{resultsCount !== 1 ? "s" : ""} found
        </p>
      )}
    </div>
  );
}
