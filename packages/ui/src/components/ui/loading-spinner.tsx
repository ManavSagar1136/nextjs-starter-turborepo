import * as React from "react";
import { cn } from "../../lib/utils";
import { Loader2 } from "lucide-react";

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "muted" | "primary" | "destructive";
  text?: string;
}

export function LoadingSpinner({ size = "md", variant = "default", text, className, ...props }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  };

  const variantClasses = {
    default: "text-foreground",
    muted: "text-muted-foreground",
    primary: "text-primary",
    destructive: "text-destructive",
  };

  return (
    <div className={cn("flex items-center justify-center", className)} {...props}>
      <Loader2 className={cn("animate-spin", sizeClasses[size], variantClasses[variant])} />
      {text && <span className="text-muted-foreground ml-2 text-sm">{text}</span>}
    </div>
  );
}
