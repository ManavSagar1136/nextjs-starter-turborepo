import * as React from "react";
import { cn } from "@/lib/utils";

export interface LoadingDotsProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "muted" | "primary" | "destructive";
  text?: string;
}

export function LoadingDots({ size = "md", variant = "default", text, className, ...props }: LoadingDotsProps) {
  const sizeClasses = {
    sm: "h-1 w-1",
    md: "h-2 w-2",
    lg: "h-3 w-3",
  };

  const variantClasses = {
    default: "bg-foreground",
    muted: "bg-muted-foreground",
    primary: "bg-primary",
    destructive: "bg-destructive",
  };

  return (
    <div className={cn("flex items-center justify-center gap-1", className)} {...props}>
      <div
        className={cn("animate-pulse rounded-full", sizeClasses[size], variantClasses[variant])}
        style={{ animationDelay: "0ms" }}
      />
      <div
        className={cn("animate-pulse rounded-full", sizeClasses[size], variantClasses[variant])}
        style={{ animationDelay: "150ms" }}
      />
      <div
        className={cn("animate-pulse rounded-full", sizeClasses[size], variantClasses[variant])}
        style={{ animationDelay: "300ms" }}
      />
      {text && <span className="text-muted-foreground ml-2 text-sm">{text}</span>}
    </div>
  );
}
