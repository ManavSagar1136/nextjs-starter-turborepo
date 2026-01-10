import * as React from "react";
import { cn } from "../../lib/utils";

export interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

export function VisuallyHidden({ className, children, ...props }: VisuallyHiddenProps) {
  return (
    <span
      className={cn(
        "absolute -m-px h-px w-px overflow-hidden border-0 p-0 whitespace-nowrap",
        "clip-path-[inset(50%)]",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
