import * as React from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Skeleton } from "./skeleton";

export interface LoadingProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "spinner" | "dots" | "pulse" | "skeleton" | "overlay";
  text?: string;
  className?: string;
  fullScreen?: boolean;
  onRetry?: () => void;
}

export function Loading({
  size = "md",
  variant = "spinner",
  text,
  className,
  fullScreen = false,
  onRetry,
}: LoadingProps) {
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "h-4 w-4";
      case "md":
        return "h-6 w-6";
      case "lg":
        return "h-8 w-8";
      case "xl":
        return "h-12 w-12";
    }
  };

  const getTextSize = () => {
    switch (size) {
      case "sm":
        return "text-sm";
      case "md":
        return "text-base";
      case "lg":
        return "text-lg";
      case "xl":
        return "text-xl";
    }
  };

  const renderSpinner = () => <Loader2 className={cn("animate-spin", getSizeClasses())} />;

  const renderDots = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className={cn(
            "animate-pulse rounded-full bg-current",
            size === "sm" && "h-2 w-2",
            size === "md" && "h-3 w-3",
            size === "lg" && "h-4 w-4",
            size === "xl" && "h-5 w-5"
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: "1s",
          }}
        />
      ))}
    </div>
  );

  const renderPulse = () => <div className={cn("animate-pulse rounded-full bg-current", getSizeClasses())} />;

  const renderSkeleton = () => (
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );

  const renderContent = () => {
    switch (variant) {
      case "dots":
        return renderDots();
      case "pulse":
        return renderPulse();
      case "skeleton":
        return renderSkeleton();
      default:
        return renderSpinner();
    }
  };

  const content = (
    <div className={cn("flex flex-col items-center justify-center space-y-4", className)}>
      {renderContent()}
      {text && <p className={cn("text-muted-foreground", getTextSize())}>{text}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
        {content}
      </div>
    );
  }

  if (variant === "overlay") {
    return (
      <div className="bg-background/80 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}

// Pre-built loading states
export function LoadingSpinner({ size = "md", className }: { size?: "sm" | "md" | "lg" | "xl"; className?: string }) {
  return <Loading variant="spinner" size={size} className={className} />;
}

export function LoadingDots({ size = "md", className }: { size?: "sm" | "md" | "lg" | "xl"; className?: string }) {
  return <Loading variant="dots" size={size} className={className} />;
}

export function LoadingPulse({ size = "md", className }: { size?: "sm" | "md" | "lg" | "xl"; className?: string }) {
  return <Loading variant="pulse" size={size} className={className} />;
}

export function LoadingSkeleton({ className }: { className?: string }) {
  return <Loading variant="skeleton" className={className} />;
}

export function LoadingOverlay({
  text,
  onRetry,
  className,
}: {
  text?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return <Loading variant="overlay" text={text} onRetry={onRetry} className={className} />;
}

export function LoadingFullScreen({
  text,
  onRetry,
  className,
}: {
  text?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return <Loading fullScreen text={text} onRetry={onRetry} className={className} />;
}
