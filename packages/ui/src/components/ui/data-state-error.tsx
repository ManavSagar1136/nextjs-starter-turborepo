"use client";

import type React from "react";
import { motion } from "framer-motion";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button, ButtonProps } from "./button";
import { cn } from "../../lib/utils";
import { LazyImage } from "./lazy-image";

// Default fallback image
const DEFAULT_ERROR_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23fee2e2'/%3E%3Cpath d='M200 100 L220 140 L260 140 L230 170 L240 210 L200 185 L160 210 L170 170 L140 140 L180 140 Z' fill='%23dc2626'/%3E%3Ctext x='50%25' y='70%25' text-anchor='middle' dy='.3em' fill='%23dc2626' font-family='sans-serif' font-size='18'%3EError%3C/text%3E%3C/svg%3E";

/**
 * Interface for the {@link ErrorData} component props.
 */
interface ErrorDataProps {
  image?: string;
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  additionalActions?: ButtonProps[];
  className?: string;
  isRetrying?: boolean;
  /**
   * Variant of the error display.
   * - "default": Full-size error state with large image (for pages, large containers)
   * - "compact": Compact error state with smaller image/icon (for dialogs, sidebars, small containers)
   */
  variant?: "default" | "compact";
  /**
   * Whether to show the image/illustration. Defaults to true.
   * Set to false for very compact spaces where only icon/text is needed.
   */
  showImage?: boolean;
  /**
   * Custom icon to display when showImage is false in compact mode.
   * Defaults to AlertCircle icon.
   */
  icon?: React.ReactNode;
}

/**
 * A reusable UI component that displays an "error state" message
 * with an illustration, title, optional description, and retry or
 * additional action buttons.
 */
export const ErrorData: React.FC<ErrorDataProps> = ({
  image = DEFAULT_ERROR_IMAGE,
  title,
  description,
  onRetry,
  retryLabel = "Try Again",
  additionalActions = [],
  className = "",
  isRetrying = false,
  variant = "default",
  showImage = true,
  icon,
}) => {
  const isCompact = variant === "compact";
  const shouldShowIcon = isCompact && !showImage;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        isCompact ? "rounded-xl px-4 py-8" : "mx-auto max-w-lg rounded-2xl px-6 py-14",
        className
      )}
    >
      {/* Illustration or Icon */}
      {showImage ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className={cn("opacity-80", isCompact ? "mb-5" : "mb-8")}
        >
          <LazyImage
            src={image}
            alt="Error state illustration"
            fallbackImage={DEFAULT_ERROR_IMAGE}
            className={cn(
              "object-contain",
              isCompact ? "h-20 w-28 sm:h-24 sm:w-36" : "h-28 w-40 sm:h-36 sm:w-56 md:h-44 md:w-72"
            )}
          />
        </motion.div>
      ) : shouldShowIcon ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className={cn("relative inline-flex items-center justify-center", isCompact ? "mb-4" : "mb-6")}
        >
          <div className={cn("bg-destructive/10 relative flex items-center justify-center rounded-full p-4")}>
            {icon || <AlertCircle className={cn("text-destructive", isCompact ? "size-8" : "size-12")} />}
          </div>
        </motion.div>
      ) : null}

      {/* Error Content */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className={cn("max-w-sm", isCompact ? "mb-1 space-y-2" : "space-y-3")}
      >
        <h3
          className={cn(
            "text-foreground font-semibold tracking-tight",
            isCompact ? "text-base leading-tight sm:text-lg" : "text-lg sm:text-xl"
          )}
        >
          {title}
        </h3>

        {description && (
          <p
            className={cn(
              "text-muted-foreground leading-relaxed",
              isCompact ? "px-1 text-xs sm:text-sm" : "text-sm sm:text-base"
            )}
          >
            {description}
          </p>
        )}
      </motion.div>

      {/* Actions */}
      {(onRetry || additionalActions.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2.5 *:max-w-60",
            isCompact ? "mt-5 max-w-xs" : "mt-6 max-w-xs sm:flex-row"
          )}
        >
          {onRetry && (
            <Button
              onClick={e => {
                e.stopPropagation();
                e.preventDefault();
                onRetry();
              }}
              disabled={isRetrying}
              size={isCompact ? "sm" : "default"}
              className={cn(
                "flex items-center justify-center gap-2 font-medium shadow-sm transition-all",
                isCompact ? "h-9 w-full rounded-lg" : "w-full rounded-lg sm:w-auto"
              )}
              variant="default"
            >
              <RefreshCw className={cn(isCompact ? "h-3.5 w-3.5" : "h-4 w-4", isRetrying ? "animate-spin" : "")} />
              {isRetrying ? "Retrying..." : retryLabel}
            </Button>
          )}

          {additionalActions.map((action, index) => (
            <Button
              {...action}
              key={index}
              size={isCompact ? "sm" : action.size || "default"}
              disabled={isRetrying || action.disabled}
              className={cn(
                "rounded-lg font-medium shadow-sm transition-all",
                isCompact ? "h-9 w-full" : "w-full sm:w-auto",
                action.className
              )}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};
