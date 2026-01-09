import * as React from "react";
import { cn } from "@/lib/utils";

export interface LoadingSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
}

export function LoadingSkeleton({
  variant = "rectangular",
  width,
  height,
  animation = "pulse",
  className,
  ...props
}: LoadingSkeletonProps) {
  const variantClasses = {
    text: "h-4 w-full",
    circular: "rounded-full",
    rectangular: "rounded-md",
  };

  const animationClasses = {
    pulse: "animate-pulse",
    wave: "animate-pulse",
    none: "",
  };

  const style = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
  };

  return (
    <div
      className={cn("bg-muted", variantClasses[variant], animationClasses[animation], className)}
      style={style}
      {...props}
    />
  );
}
