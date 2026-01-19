"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * ImagePreviewProps
 *
 * Props for the {@link ImagePreview} component.
 */
export interface ImagePreviewProps {
  children: React.ReactNode;
  src: string;
  alt?: string;
  caption?: string;
  showCaption?: boolean;
  lightboxClassName?: string;
  lightboxImageClassName?: string;
  lightboxCaptionClassName?: string;
  closeButtonClassName?: string;
  closeButtonIcon?: React.ReactNode;
  onOpen?: () => void;
  onClose?: () => void;
}

/**
 * ImagePreview
 *
 * Renders a trigger element (children). When triggered (clicked), it opens a modal
 * lightbox to display a preview of the image specified by `src`, with accessibility,
 * keyboard support (ESC closes), optional caption, and customizable styles.
 *
 * Example usage:
 *
 * ```tsx
 * <ImagePreview src="/img.jpg" alt="Demo" caption="A demo image">
 *   <img src="/img-thumb.jpg" alt="Demo" />
 * </ImagePreview>
 * ```
 */
export const ImagePreview = ({
  children,
  src,
  alt = "",
  caption,
  showCaption = true,
  lightboxClassName,
  lightboxImageClassName,
  lightboxCaptionClassName,
  closeButtonClassName,
  closeButtonIcon,
  onOpen,
  onClose,
}: ImagePreviewProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
    onOpen?.();
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && isOpen) {
      handleClose();
    }
  };

  const displayCaption = caption || alt;

  const trigger = React.isValidElement(children)
    ? React.cloneElement(
        children as React.ReactElement<{
          onClick?: (e: React.MouseEvent) => void;
        }>,
        {
          onClick: (e: React.MouseEvent) => {
            const originalOnClick = (
              children as React.ReactElement<{
                onClick?: (e: React.MouseEvent) => void;
              }>
            )?.props?.onClick;
            originalOnClick?.(e);
            handleOpen();
          },
        }
      )
    : children;

  return (
    <>
      {trigger}

      {/* Lightbox Modal */}
      {isOpen && (
        <span
          className={cn("fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4", lightboxClassName)}
          onClick={handleClose}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
          tabIndex={-1}
        >
          <button
            onClick={handleClose}
            className={cn(
              "absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70 hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white",
              closeButtonClassName
            )}
            aria-label="Close image preview"
            tabIndex={0}
          >
            {closeButtonIcon || <X className="h-6 w-6" />}
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className={cn("max-h-[90vh] max-w-full object-contain", lightboxImageClassName)}
            onClick={e => e.stopPropagation()}
          />
          {showCaption && displayCaption && (
            <span
              className={cn(
                "absolute bottom-4 left-1/2 block max-w-2xl -translate-x-1/2 transform rounded-lg bg-black/70 px-4 py-2 text-center text-white",
                lightboxCaptionClassName
              )}
            >
              {displayCaption}
            </span>
          )}
        </span>
      )}
    </>
  );
};

/**
 * Used by React DevTools and debugging utilities.
 */
ImagePreview.displayName = "ImagePreview";
