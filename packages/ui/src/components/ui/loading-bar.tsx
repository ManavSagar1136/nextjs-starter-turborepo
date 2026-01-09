import * as React from "react";
import { cn } from "@/lib/utils";

export interface LoadingBarProps extends React.HTMLAttributes<HTMLDivElement> {
  progress?: number;
  variant?: "default" | "primary" | "success" | "warning" | "destructive";
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  text?: string;
}

export function LoadingBar({
  progress = 0,
  variant = "default",
  size = "md",
  animated = false,
  text,
  className,
  ...props
}: LoadingBarProps) {
  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const variantClasses = {
    default: "bg-primary",
    primary: "bg-primary",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    destructive: "bg-destructive",
  };

  return (
    <div className={cn("space-y-2", className)} {...props}>
      {text && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{text}</span>
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
      )}
      <div className={cn("bg-muted w-full overflow-hidden rounded-full", sizeClasses[size])}>
        <div
          className={cn(
            "h-full transition-all duration-300 ease-in-out",
            variantClasses[variant],
            animated && "animate-pulse"
          )}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}
