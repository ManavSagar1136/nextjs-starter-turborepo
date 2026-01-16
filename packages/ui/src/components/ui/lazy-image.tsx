/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Skeleton } from "./skeleton";
import { cn } from "../../lib/utils";

// Default fallback image - can be overridden
const DEFAULT_FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-family='sans-serif' font-size='18'%3EImage not found%3C/text%3E%3C/svg%3E";

declare global {
  /**
   * Props for the {@link LazyImage} component.
   *
   * @remarks
   * Extends standard `img` HTML attributes with custom lazy loading and error handling behavior.
   */
  interface ILazyImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "onError" | "onLoad"> {
    placeholderSrc?: string;
    placeholderDiv?: React.ReactNode;
    hideSkeleton?: boolean;
    renderError?: React.ReactNode;
    src: string;
    fallbackImage?: string;
  }
}

/**
 * A React component that provides robust lazy loading and error fallback functionality for images.
 *
 * The component will:
 * - Show a placeholder or skeleton while the image is loading
 * - Render a custom or default fallback if the image fails to load
 * - Fade in the image once it's fully loaded
 *
 * @param props - {@link ILazyImageProps} object containing configuration for image behavior.
 *
 * @returns A React element that wraps an image with lazy loading and error handling features.
 */
const LazyImage: React.FC<ILazyImageProps> = ({
  alt,
  placeholderSrc = "",
  placeholderDiv,
  title,
  width = "100%",
  height = "100%",
  className,
  hideSkeleton = false,
  renderError,
  src,
  fallbackImage = DEFAULT_FALLBACK_IMAGE,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);

  /**
   * Determine the final source for the image.
   * If `src` is provided, use it; otherwise, use a fallback image.
   */
  const finalSrc = useMemo(() => src || fallbackImage, [src, fallbackImage]);

  /**
   * Handle image loading
   */
  const handleOnLoad = useCallback(() => {
    setIsLoaded(true);
    setIsError(false);
  }, []);

  /**
   * Handle image error
   */
  const handleOnError = useCallback(() => {
    setIsLoaded(false);
    setIsError(true);
  }, []);

  // Check if image is already cached and loaded
  useEffect(() => {
    const imgEl = imageRef.current;
    if (imgEl && imgEl.complete && imgEl.naturalWidth !== 0) {
      setIsLoaded(true);
      setIsError(false);
    }

    // Fallback image loader using new Image()
    const img = new Image();
    img.src = finalSrc;
    img.onload = () => handleOnLoad();
    img.onerror = () => handleOnError();
  }, [finalSrc, handleOnLoad, handleOnError]);

  /**
   * Common props for all the image elements
   */
  const sharedImageProps = {
    alt,
    title: title || alt,
    height,
    width,
    ...props,
  };

  /**
   * Render error fallback
   */
  if (isError) {
    return (
      renderError || (
        <img
          src={fallbackImage}
          className={cn("size-full object-cover select-none", className)}
          {...sharedImageProps}
        />
      )
    );
  }

  return (
    <>
      {/* Placeholder or skeleton */}
      {!isLoaded && (
        <>
          {placeholderSrc ? (
            <img
              src={placeholderSrc}
              alt="Placeholder"
              title="Loading"
              className="skeleton h-full w-full object-cover"
              height={height}
              width={width}
            />
          ) : (
            !hideSkeleton && (placeholderDiv || <Skeleton className="size-full" />)
          )}
        </>
      )}

      {/* Actual image */}
      <img
        ref={imageRef}
        src={finalSrc}
        onLoad={handleOnLoad}
        onError={handleOnError}
        loading={props?.loading || "lazy"}
        className={cn("h-full w-full object-cover select-none", !isLoaded && "opacity-0", className)}
        {...sharedImageProps}
      />
    </>
  );
};

export { LazyImage };
