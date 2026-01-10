import * as React from "react";
import { cn } from "../../lib/utils";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  center?: boolean;
  padding?: boolean;
  children: React.ReactNode;
}

export function Container({
  size = "lg",
  center = true,
  padding = true,
  className,
  children,
  ...props
}: ContainerProps) {
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
    "2xl": "max-w-7xl",
    full: "max-w-full",
  };

  return (
    <div
      className={cn("w-full", sizeClasses[size], center && "mx-auto", padding && "px-4 sm:px-6 lg:px-8", className)}
      {...props}
    >
      {children}
    </div>
  );
}
