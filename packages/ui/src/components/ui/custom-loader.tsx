import React, { memo } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

export interface CustomLoaderProps {
  /** Size of the loader - 'full' takes up entire screen/container */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "full";

  /** Variant of the loader */
  variant?: "spinner" | "dots" | "pulse" | "progress" | "custom";

  /** Optional text to display beside/below the loader */
  text?: string;

  /** Position of text relative to loader */
  textPosition?: "right" | "bottom";

  /** Custom icon/element to replace the default spinner */
  customIcon?: React.ReactNode;

  /** Show overlay background */
  showOverlay?: boolean;

  /** Overlay background color/opacity classes */
  overlayClassName?: string;

  /** Render children with reduced opacity while loading */
  children?: React.ReactNode;

  /** Opacity of children when loading (0-100) */
  childrenOpacity?: number;

  /** Additional className for the loader container */
  className?: string;

  /** Additional className for the spinner/loader element */
  loaderClassName?: string;

  /** Accessibility label */
  ariaLabel?: string;

  /** Progress value (0-100) for progress variant */
  progress?: number;

  /** Color of the loader */
  color?: string;

  /** Show/hide the loader */
  isLoading?: boolean;

  /** Z-index for overlay mode */
  zIndex?: number;
}

// Constants moved outside component for better performance
const SIZE_CLASSES = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-8 h-8",
  lg: "w-12 h-12",
  xl: "w-16 h-16",
  full: "w-12 h-12",
} as const;

const TEXT_SIZE_CLASSES = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  full: "text-lg",
} as const;

// Loader variant components moved outside for better performance
interface LoaderVariantProps {
  size: "xs" | "sm" | "md" | "lg" | "xl" | "full";
  color?: string;
  loaderClassName?: string;
  progress?: number;
}

const SpinnerIcon: React.FC<LoaderVariantProps> = ({ size, color, loaderClassName }) => (
  <Loader2
    className={cn("animate-spin", SIZE_CLASSES[size], color || "text-primary", loaderClassName)}
    aria-hidden="true"
  />
);

const DotsLoader: React.FC<LoaderVariantProps> = ({ size, color, loaderClassName }) => (
  <div className={cn("flex space-x-1", loaderClassName)}>
    {[0, 1, 2].map(i => (
      <div
        key={i}
        className={cn(
          "animate-bounce rounded-full",
          size === "xs" && "h-1 w-1",
          size === "sm" && "h-1.5 w-1.5",
          size === "md" && "h-2 w-2",
          size === "lg" && "h-3 w-3",
          size === "xl" && "h-4 w-4",
          size === "full" && "h-3 w-3",
          color || "bg-primary"
        )}
        style={{
          animationDelay: `${i * 0.15}s`,
        }}
      />
    ))}
  </div>
);

const PulseLoader: React.FC<LoaderVariantProps> = ({ size, color, loaderClassName }) => (
  <div className={cn("animate-pulse rounded-full", SIZE_CLASSES[size], color || "bg-primary", loaderClassName)} />
);

const ProgressBar: React.FC<LoaderVariantProps> = ({ size, color, loaderClassName, progress = 0 }) => (
  <div
    className={cn(
      "w-full overflow-hidden rounded-full bg-gray-200",
      size === "xs" && "h-1",
      size === "sm" && "h-1.5",
      size === "md" && "h-2",
      size === "lg" && "h-3",
      size === "xl" && "h-4",
      size === "full" && "h-2 max-w-xs",
      loaderClassName
    )}
    role="progressbar"
    aria-valuenow={progress}
    aria-valuemin={0}
    aria-valuemax={100}
  >
    <div
      className={cn("h-full rounded-full transition-all duration-300 ease-out", color || "bg-primary")}
      style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
    />
  </div>
);

const CustomLoader: React.FC<CustomLoaderProps> = ({
  size = "md",
  variant = "spinner",
  text,
  textPosition = "bottom",
  customIcon,
  showOverlay = false,
  overlayClassName,
  children,
  childrenOpacity = 30,
  className,
  loaderClassName,
  ariaLabel = "Loading",
  progress = 0,
  color,
  isLoading = true,
  zIndex = 50,
}) => {
  // Render appropriate loader based on variant
  const renderLoader = () => {
    if (customIcon) {
      return customIcon;
    }

    const loaderProps = { size, color, loaderClassName, progress };

    switch (variant) {
      case "dots":
        return <DotsLoader {...loaderProps} />;
      case "pulse":
        return <PulseLoader {...loaderProps} />;
      case "progress":
        return <ProgressBar {...loaderProps} />;
      case "spinner":
      default:
        return <SpinnerIcon {...loaderProps} />;
    }
  };

  // Loader content (icon + text)
  const loaderContent = (
    <div
      className={cn(
        "flex flex-1 items-center justify-center",
        textPosition === "bottom" ? "flex-col gap-3" : "flex-row gap-3",
        variant === "progress" && "w-full flex-col gap-3",
        className
      )}
      role="status"
      aria-busy={isLoading}
      aria-label={ariaLabel}
    >
      {renderLoader()}
      {text && <span className={cn("font-medium", TEXT_SIZE_CLASSES[size], color || "text-foreground")}>{text}</span>}
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );

  // Early returns after all hooks
  // If not loading and no children, return null
  if (!isLoading && !children) {
    return null;
  }

  // If not loading but has children, return children only
  if (!isLoading && children) {
    return <>{children}</>;
  }

  // Full-screen or overlay mode
  if (size === "full" || showOverlay) {
    return (
      <div
        className={cn(
          "fixed inset-0 flex items-center justify-center",
          overlayClassName || "bg-background/80 backdrop-blur-sm"
        )}
        style={{ zIndex }}
      >
        {children && (
          <div className="absolute inset-0" style={{ opacity: childrenOpacity / 100 }}>
            {children}
          </div>
        )}
        <div className="relative z-10">{loaderContent}</div>
      </div>
    );
  }

  // Inline mode with children
  if (children) {
    return (
      <div className="relative h-full w-full">
        <div className="h-full w-full" style={{ opacity: childrenOpacity / 100 }}>
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">{loaderContent}</div>
      </div>
    );
  }

  // Default inline mode
  return loaderContent;
};

// Wrap component with memo for performance optimization
export default memo(CustomLoader);
