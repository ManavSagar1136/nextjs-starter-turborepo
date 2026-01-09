import * as React from "react";
import { cn } from "@/lib/utils";

export interface ScrollbarProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical" | "both";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Scrollbar({ orientation = "both", size = "md", className, children, ...props }: ScrollbarProps) {
  const sizeClasses = {
    sm: "scrollbar-thin",
    md: "scrollbar",
    lg: "scrollbar-thick",
  };

  const orientationClasses = {
    horizontal: "overflow-x-auto overflow-y-hidden",
    vertical: "overflow-y-auto overflow-x-hidden",
    both: "overflow-auto",
  };

  return (
    <div
      className={cn(
        sizeClasses[size],
        orientationClasses[orientation],
        "scrollbar-track-transparent scrollbar-thumb-muted-foreground/20 scrollbar-thumb-rounded-full hover:scrollbar-thumb-muted-foreground/30",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
