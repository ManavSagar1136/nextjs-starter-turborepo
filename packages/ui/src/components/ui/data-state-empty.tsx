"use client";

import type React from "react";
import { motion } from "framer-motion";
import { Folder } from "lucide-react";

import { Button, ButtonProps } from "./button";

import { cn } from "../../lib/utils";

import { LazyImage } from "./lazy-image";

/**
 * Interface for the {@link EmptyData} component props.
 */
interface EmptyDataProps {
  image?: string;
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  actions?: ButtonProps[];
  className?: string;
  /**
   * Variant of the empty display.
   * - "default": Full-size empty state with large image (for pages, large containers)
   * - "compact": Compact empty state with smaller image/icon (for dialogs, sidebars, small containers)
   */
  variant?: "default" | "compact";
  /**
   * Whether to show the image/illustration. Defaults to true.
   * Set to false for very compact spaces where only icon/text is needed.
   */
  showImage?: boolean;
  /**
   * Custom icon to display when showImage is false in compact mode.
   * Defaults to Folder icon.
   */
  icon?: React.ReactNode;
}

/**
 * A reusable UI component that displays an "empty state" message
 * with an illustration, title, optional description, and optional
 * action buttons.
 *
 * @param image - The URL of the image to display. Defaults to "/assets/icons/images/data-empty.svg".
 * @param title - The title of the empty state message.
 * @param description - Optional description text to display below the title.
 * @param actions - An array of action buttons to display.
 * @param className - Optional additional class names for styling.
 * @param variant - Display variant: "default" for full-size (pages, large containers) or
 * "compact" for smaller spaces (dialogs, sidebars). Defaults to "default".
 * @param showImage - Whether to show the image/illustration. Defaults to true.
 * Set to false for very compact spaces.
 * @param icon - Custom icon to display when showImage is false in compact mode.
 * Defaults to Folder icon.
 *
 * @returns A React functional component rendering an animated
 * empty-state layout with optional actions.
 *
 * @example Basic usage (default variant)
 * ```tsx
 * <EmptyData
 *   title="No Results Found"
 *   description="Try adjusting your search or filter options."
 *   actions={[{ children: "Retry", onClick: handleRetry }]}
 * />
 * ```
 *
 * @example Compact variant for dialogs/sidebars
 * ```tsx
 * <EmptyData
 *   variant="compact"
 *   title="No folders found"
 *   description="Create one to get started."
 * />
 * ```
 *
 * @example Very compact with icon only
 * ```tsx
 * <EmptyData
 *   variant="compact"
 *   showImage={false}
 *   title="No items"
 * />
 * ```
 */
export const EmptyData: React.FC<EmptyDataProps> = ({
  image = "/assets/icons/images/data-empty.svg",
  title,
  description,
  actions = [],
  className = "",
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
        isCompact ? "rounded-xl px-4 py-8" : "rounded-2xl px-4 py-10",
        className
      )}
    >
      {/* Image or Icon */}
      {showImage ? (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className={cn(isCompact ? "mb-5" : "mb-6")}
        >
          <LazyImage
            src={image}
            alt="Empty state illustration"
            className={cn(
              "object-contain opacity-90",
              isCompact ? "h-24 w-48 sm:h-28 sm:w-56" : "h-32 w-64 sm:h-40 md:h-48 md:w-80"
            )}
          />
        </motion.div>
      ) : shouldShowIcon ? (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className={cn("relative inline-flex items-center justify-center", isCompact ? "mb-4" : "mb-6")}
        >
          {/* Icon container */}
          <div className={cn("bg-muted relative flex items-center justify-center rounded-full p-4 backdrop-blur-sm")}>
            {icon || <Folder className={cn("text-muted-foreground", isCompact ? "size-8" : "size-12")} />}
          </div>
        </motion.div>
      ) : null}

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className={cn("max-w-sm", isCompact ? "mb-1 space-y-2" : "space-y-3")}
      >
        <h3
          className={cn(
            "text-foreground font-semibold tracking-tight",
            isCompact ? "text-base leading-tight sm:text-lg" : "text-xl sm:text-2xl"
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
      {actions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className={cn(
            "flex w-full flex-col justify-center gap-2.5",
            isCompact ? "mt-5 max-w-xs" : "mt-8 max-w-sm sm:flex-row"
          )}
        >
          {actions.map((action, index) => (
            <Button
              key={index}
              {...action}
              size={isCompact ? "sm" : action.size || "default"}
              className={cn(
                "font-medium transition-all",
                isCompact ? "h-9 w-full rounded-lg" : "rounded-lg",
                action.className
              )}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};
