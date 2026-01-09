import * as React from "react";
import { cn } from "@/lib/utils";

export interface CoverProps extends React.HTMLAttributes<HTMLDivElement> {
  minHeight?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  children: React.ReactNode;
}

export function Cover({ minHeight = "md", className, children, ...props }: CoverProps) {
  const minHeightClasses = {
    sm: "min-h-[200px]",
    md: "min-h-[400px]",
    lg: "min-h-[600px]",
    xl: "min-h-[800px]",
    "2xl": "min-h-[1000px]",
    full: "min-h-screen",
  };

  return (
    <div className={cn("flex items-center justify-center", minHeightClasses[minHeight], className)} {...props}>
      {children}
    </div>
  );
}
