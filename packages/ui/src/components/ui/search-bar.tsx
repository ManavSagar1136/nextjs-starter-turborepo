"use client";

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "./input";
import { cn } from "../../lib/utils";
import { useDebounce } from "../../hooks/use-debounce";

const SEARCH_DEBOUNCE_TIME = 350;

/**
 * Ref interface exposed by the SearchBar component.
 * Allows external components to call `resetQuery()` to clear the input.
 */
export interface ISearchBarRefType {
  /**
   * Resets the query/input value to an empty string.
   */
  resetQuery: () => void;
}

/**
 * Props for the SearchBar component.
 */
interface ISearchBarProps extends React.ComponentProps<typeof Input> {
  /**
   * Hide the close/clear (`X`) icon when true.
   */
  hideCloseIcon?: boolean;

  /**
   * The key to use for the search query in the URL (default: "query").
   */
  queryKey?: string;

  /**
   * If true, do not sync search query to the URL.
   */
  disableUrlStorage?: boolean;

  /**
   * Optional callback that fires after query changes (debounced).
   * @param params - An object with the `query` key.
   */
  onValueChange?: (params: { query: string }) => void;

  /**
   * Additional search params to set in the URL when the query changes.
   * Useful for forcing/resetting pagination, filters etc alongside search.
   * Use an object: `{ param: value, ... }`
   */
  onValueChangeSetParams?: Record<string, string>;

  /**
   * If provided and paired with `setExternalQuery`, SearchBar runs in controlled mode.
   * The value of the input.
   */
  externalQuery?: string;

  /**
   * If provided and paired with `externalQuery`, SearchBar runs in controlled mode.
   * Setter for the search query value.
   */
  setExternalQuery?: (query: string) => void;
}

/**
 * SearchBar component: a stylable search input that optionally synchronizes with the URL or can be controlled externally.
 *
 * - In *uncontrolled mode* (default): controls its own value and can sync the search term to the URL and call onValueChange on change.
 * - In *controlled mode*: managed by an external value and setter, e.g. for stateful, non-URL-based search.
 *
 * @example
 * <SearchBar queryKey="search" placeholder="Search..." />
 */
const SearchBar = forwardRef<ISearchBarRefType, ISearchBarProps>(
  (
    {
      className,
      queryKey = "query",
      disableUrlStorage = false,
      hideCloseIcon = false,
      externalQuery,
      setExternalQuery,
      onValueChange,
      onValueChangeSetParams = {},
      ...props
    },
    ref
  ) => {
    // Next.js navigation hooks for manipulating URL/search params.
    const router = useRouter();
    const pathName = usePathname();
    const searchParams = useSearchParams();

    // Controlled mode if both value and setter are provided.
    const isControlled = externalQuery !== undefined && setExternalQuery !== undefined;

    /**
     * Internal search query state for uncontrolled mode.
     * - If not disabling URL storage, initialize from query param in URL.
     * - Otherwise default to empty.
     */
    const [internalQuery, setInternalQuery] = useState(() => {
      if (!disableUrlStorage) {
        return searchParams?.get(queryKey) || "";
      }
      return "";
    });

    // Which value/setter to use depending on controlled/uncontrolled mode.
    const query = isControlled ? externalQuery! : internalQuery;
    const setQuery = isControlled ? setExternalQuery! : setInternalQuery;

    // Debounce the search query to reduce spamming search/URL updates.
    const debouncedQuery = useDebounce(query, SEARCH_DEBOUNCE_TIME);

    // Used to skip running effect logic on initial render.
    const isMounted = useRef(false);

    /**
     * On initial mount, sync query in state from the URL, if using URL storage.
     * (Prevents race conditions/incorrect initial values.)
     * Only runs once.
     */
    useEffect(() => {
      if (disableUrlStorage) return;
      const urlQuery = searchParams?.get(queryKey) || "";
      if (urlQuery !== query) {
        setQuery(urlQuery);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /**
     * Each time the debounced query changes:
     * - Call the optional onValueChange callback.
     * - If URL storage is enabled, update the URL's query param (plus any additional params).
     *   (If the param doesn't exist, remove it from the URL.)
     * - Also update any extra params provided by onValueChangeSetParams (e.g. to reset 'page').
     */
    useEffect(() => {
      if (!isMounted.current) {
        isMounted.current = true;
        return; // Prevent running on first render.
      }

      // Notify parent with current debounced query.
      onValueChange?.({ query: debouncedQuery });

      if (disableUrlStorage) return;

      const params = new URLSearchParams(searchParams?.toString());
      const currentUrlQuery = params.get(queryKey) || "";

      // Only update URL if query has actually changed (debounced).
      if (currentUrlQuery !== debouncedQuery) {
        if (debouncedQuery) {
          params.set(queryKey, debouncedQuery);
        } else {
          params.delete(queryKey);
        }

        // Handle any other params that should be set/reset (e.g. page=1 on search change).
        Object.entries(onValueChangeSetParams).forEach(([key, value]) => {
          if (value) params.set(key, value);
          else params.delete(key);
        });

        // Replace the current URL without full page navigation, and don't scroll.
        router.replace(`${pathName}?${params.toString()}`, { scroll: false });
      }
    }, [
      debouncedQuery,
      disableUrlStorage,
      queryKey,
      onValueChange,
      router,
      pathName,
      searchParams,
      onValueChangeSetParams,
    ]);

    /**
     * Expose a ref API to parent components to clear the query/input.
     */
    useImperativeHandle(ref, () => ({
      resetQuery: () => setQuery(""),
    }));

    /**
     * Handler to clear the search query (input and possibly URL).
     */
    const handleClearQuery = useCallback(() => {
      setQuery("");
    }, [setQuery]);

    return (
      <div
        className={cn(
          "border-input relative h-10 w-full rounded-md border dark:border-white/20 dark:bg-white/10",
          className
        )}
      >
        {/* Search icon on the left inside input */}
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 z-10 size-4 -translate-y-1/2 transform" />
        <Input
          {...props}
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            // Allow user override of onChange if needed
            props.onChange?.(e);
          }}
          className={cn(
            "h-full border-none bg-transparent pl-11 focus-visible:ring-0 focus-visible:ring-offset-0 dark:border-white/20",
            query?.length > 0 ? "pr-11" : "pr-3",
            (props as any)?.className
          )}
        />

        {/* Close/clear icon appears when there's input, unless explicitly hidden */}
        {!hideCloseIcon && query?.length > 0 && (
          <X
            onClick={handleClearQuery}
            className="text-muted-foreground hover:text-primary absolute top-1/2 right-3 size-4 -translate-y-1/2 cursor-pointer"
            aria-label="Clear search"
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClearQuery();
              }
            }}
          />
        )}
      </div>
    );
  }
);

SearchBar.displayName = "SearchBar";
export default SearchBar;
