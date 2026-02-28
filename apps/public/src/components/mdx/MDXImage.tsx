"use client";

import React from "react";

import { ImagePreview } from "@buildbase/ui/components/ui/image-preview";

import { cn } from "@buildbase/ui/lib/utils";

import { LazyImage } from "../ui/lazy-image";

/**
 * MDXImage component for rendering images in MDX content.
 * Provides image preview functionality with lightbox support.
 */
const MDXImage = ({
  src,
  alt,
  className,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) => {
  // Show placeholder in editor preview if src is missing
  if (!src || typeof src !== "string") {
    return (
      <div className="my-8 p-8 border-2 border-dashed border-slate-100 dark:border-dark-surface-elevated rounded-lg text-center">
        <div className="text-slate-400 dark:text-slate-600 text-sm">
          <p className="font-medium mb-2">MDXImage Component</p>
          <p>Add a src prop to preview the image</p>
        </div>
      </div>
    );
  }

  return (
    <ImagePreview src={src} alt={alt}>
      <span className="block my-8">
        <span className="block rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg group cursor-pointer relative">
          <span className="block relative overflow-hidden">
            {}
            <LazyImage
              src={src}
              alt={alt || ""}
              className={cn(
                "w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105",
                className,
              )}
              {...props}
            />
          </span>
          {alt && (
            <span className="block px-4 py-3 bg-slate-100/50 dark:bg-dark-surface-elevated/50 text-sm text-slate-400 dark:text-slate-600 text-center">
              {alt}
            </span>
          )}
        </span>
      </span>
    </ImagePreview>
  );
};

export default MDXImage;
