"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

import { cn } from "@buildbase/ui/lib/utils";

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
        },
      )
    : children;

  return (
    <>
      {trigger}

      {/* Lightbox Modal */}
      {isOpen && (
        <span
          className={cn(
            "fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4",
            lightboxClassName,
          )}
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
              "absolute top-4 right-4 text-white hover:text-gray-300 transition-colors p-2 rounded-full bg-black/50 hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white",
              closeButtonClassName,
            )}
            aria-label="Close image preview"
            tabIndex={0}
          >
            {closeButtonIcon || <X className="w-6 h-6" />}
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className={cn(
              "max-w-full max-h-[90vh] object-contain",
              lightboxImageClassName,
            )}
            onClick={(e) => e.stopPropagation()}
          />
          {showCaption && displayCaption && (
            <span
              className={cn(
                "absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg max-w-2xl text-center block",
                lightboxCaptionClassName,
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
