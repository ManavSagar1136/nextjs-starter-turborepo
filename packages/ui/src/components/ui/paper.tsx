import * as React from "react";
import { cn } from "@/lib/utils";

export interface PaperProps extends React.HTMLAttributes<HTMLDivElement> {
  shadow?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  radius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  padding?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  withBorder?: boolean;
  children: React.ReactNode;
}

export function Paper({
  shadow = "sm",
  radius = "md",
  padding = "md",
  withBorder = false,
  className,
  children,
  ...props
}: PaperProps) {
  const shadowClasses = {
    none: "shadow-none",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
    "2xl": "shadow-2xl",
  };

  const radiusClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    full: "rounded-full",
  };

  const paddingClasses = {
    none: "p-0",
    xs: "p-2",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
  };

  return (
    <div
      className={cn(
        "bg-background",
        shadowClasses[shadow],
        radiusClasses[radius],
        paddingClasses[padding],
        withBorder && "border-border border",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
