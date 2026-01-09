import * as React from "react";
import { cn } from "@/lib/utils";

export interface GroupProps extends React.HTMLAttributes<HTMLDivElement> {
  position?: "left" | "center" | "right" | "apart";
  spacing?: "xs" | "sm" | "md" | "lg" | "xl";
  wrap?: boolean;
  children: React.ReactNode;
}

export function Group({ position = "left", spacing = "md", wrap = false, className, children, ...props }: GroupProps) {
  const positionClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
    apart: "justify-between",
  };

  const spacingClasses = {
    xs: "gap-1",
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
    xl: "gap-8",
  };

  return (
    <div
      className={cn(
        "flex items-center",
        positionClasses[position],
        spacingClasses[spacing],
        wrap && "flex-wrap",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
