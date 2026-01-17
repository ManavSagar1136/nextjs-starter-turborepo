import React from "react";
import { UseQueryResult } from "@tanstack/react-query";

import { Skeleton } from "./skeleton";

import { cn } from "../../lib/utils";

import CustomLoader from "./custom-loader";
import { EmptyData } from "./data-state-empty";
import { ErrorData } from "./data-state-error";

/**
 * Type definitions for error and empty state renderers
 */
type ErrorRenderer = (() => React.ReactNode) | React.ReactNode | React.ComponentProps<typeof ErrorData> | null;

type EmptyRenderer = (() => React.ReactNode) | React.ReactNode | React.ComponentProps<typeof EmptyData> | null;

/**
 * Generic helper function to render state components based on different input types.
 * Handles React elements, functions, component props objects, and default fallback.
 *
 * @typeParam TProps - The props type of the component to render
 * @param view - The view to render (element, function, props object, or null/undefined)
 * @param Component - The React component to use for default/props rendering
 * @param defaultTitle - Default title to use when no view is provided
 * @param additionalProps - Additional props to merge with component props
 * @returns A React node containing the rendered state
 */
const renderStateView = <TProps extends { title: string | React.ReactNode }>(
  view: (() => React.ReactNode) | React.ReactNode | TProps | null | undefined,
  Component: React.ComponentType<TProps>,
  defaultTitle: string,
  additionalProps?: Partial<TProps>
): React.ReactNode => {
  if (!view) {
    return <Component {...({ title: defaultTitle, ...additionalProps } as TProps)} />;
  }

  if (React.isValidElement(view)) {
    return view;
  }

  if (typeof view === "function") {
    return view();
  }

  if (typeof view === "object" && !React.isValidElement(view) && "title" in view) {
    return <Component {...({ ...view, ...additionalProps } as TProps)} />;
  }

  return <Component {...({ title: defaultTitle, ...additionalProps } as TProps)} />;
};

/**
 * Helper function to render error state based on different input types.
 * Handles React elements, functions, ErrorData props objects, and default fallback.
 */
const renderErrorState = (
  errorView: ErrorRenderer | undefined,
  defaultTitle: string,
  onRetry?: () => void,
  isRetrying?: boolean
): React.ReactNode => {
  const additionalProps = onRetry !== undefined || isRetrying !== undefined ? { onRetry, isRetrying } : undefined;
  return renderStateView(errorView, ErrorData, defaultTitle, additionalProps);
};

/**
 * Helper function to render empty state based on different input types.
 * Handles React elements, functions, EmptyData props objects, and default fallback.
 */
const renderEmptyState = (emptyView: EmptyRenderer | undefined, defaultTitle: string): React.ReactNode => {
  return renderStateView(emptyView, EmptyData, defaultTitle);
};

/**
 * A generic renderer component that handles different UI states when displaying a list of data items.
 *
 * The component supports rendering loading skeletons, error messages, empty states,
 * and the list of items themselves depending on the state of the input props.
 *
 * @typeParam T - The type of the items in the data array.
 */
interface IDataStateRendererProps<T> {
  data: T[] | undefined;
  loading?: boolean;
  error?: boolean;
  className?: string;
  renderItem: (item: T, index: number) => React.ReactNode;
  renderSkeleton?: ((index: number) => React.ReactNode) | React.ReactNode;
  skeletonCount?: number;
  renderError?: ErrorRenderer;
  renderEmpty?: EmptyRenderer;
  onRetry?: () => void;
  isRetrying?: boolean;
}

/**
 * Renders UI content based on the state of the data.
 *
 * - Shows skeletons if `loading` is true.
 * - Shows error UI if `error` is true.
 * - Shows empty state if `data` is `undefined` or empty.
 * - Otherwise, renders each item in `data` using the provided `renderItem`.
 *
 * @typeParam T - The type of the items in the data array.
 *
 * @param props - The {@link IDataStateRendererProps} used to configure the renderer.
 * @returns A React node containing the rendered state.
 *
 * @example
 * ```tsx
 * <DataStateRenderer
 *   data={users}
 *   loading={isLoading}
 *   error={hasError}
 *   className="grid grid-cols-3 gap-4"
 *   renderItem={(user) => <UserCard user={user} />}
 * />
 * ```
 */
export function DataStateRenderer<T>({
  data,
  loading = false,
  error = false,
  className,
  renderItem,
  renderSkeleton,
  skeletonCount = 6,
  renderError,
  renderEmpty,
  isRetrying = false,
  onRetry,
}: IDataStateRendererProps<T>) {
  if (loading) {
    return (
      <div className={cn(className)}>
        {Array.from({ length: skeletonCount }).map((_, i) => {
          if (renderSkeleton) {
            return (
              <React.Fragment key={i}>
                {typeof renderSkeleton === "function" ? renderSkeleton(i) : renderSkeleton}
              </React.Fragment>
            );
          }
          return <Skeleton key={i} className="aspect-square w-full rounded-md" />;
        })}
      </div>
    );
  }

  if (error) {
    return renderErrorState(renderError, "Something went wrong", onRetry, isRetrying);
  }

  if (!data || data.length === 0) {
    return renderEmptyState(renderEmpty, "No results found");
  }

  return (
    <div className={cn(className)}>
      {data.map((item, index) => (
        <React.Fragment key={index}>{renderItem(item, index)}</React.Fragment>
      ))}
    </div>
  );
}

interface IRequestDataStateRendererProps<T> {
  request: UseQueryResult<T, unknown>;
  children: React.ReactNode;
  skeleton?: React.ReactNode | null;
  errorView?: ErrorRenderer;
  emptyView?: EmptyRenderer;
  isEmpty?: (data: T | undefined) => boolean;
}

export const RequestDataStateRenderer = <T,>({
  request,
  children,
  skeleton,
  errorView,
  isEmpty = () => false,
  emptyView,
}: IRequestDataStateRendererProps<T>) => {
  const isEmptyData = isEmpty?.(request.data);

  if (request.isLoading) {
    return skeleton ? skeleton : <CustomLoader />;
  }

  if (request.isError) {
    return renderErrorState(errorView, "Something went wrong", request.refetch, request.isFetching);
  }

  if (isEmptyData) {
    return renderEmptyState(emptyView, "No results found");
  }

  return children;
};
