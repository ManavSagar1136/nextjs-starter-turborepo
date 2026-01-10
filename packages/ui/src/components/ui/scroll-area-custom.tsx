import * as React from "react";
import { cn } from "../../lib/utils";

export interface ScrollAreaCustomProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical" | "both";
  children: React.ReactNode;
}

export function ScrollAreaCustom({ orientation = "vertical", className, children, ...props }: ScrollAreaCustomProps) {
  const orientationClasses = {
    horizontal: "overflow-x-auto overflow-y-hidden",
    vertical: "overflow-y-auto overflow-x-hidden",
    both: "overflow-auto",
  };

  return (
    <div className={cn("relative", orientationClasses[orientation], className)} {...props}>
      {children}
    </div>
  );
}
