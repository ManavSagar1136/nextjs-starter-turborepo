import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  icon: LucideIcon;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  variant?: "default" | "muted" | "primary" | "destructive" | "success" | "warning";
}

export function Icon({ icon: IconComponent, size = "md", variant = "default", className, ...props }: IconProps) {
  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
    xl: "h-8 w-8",
    "2xl": "h-10 w-10",
  };

  const variantClasses = {
    default: "text-foreground",
    muted: "text-muted-foreground",
    primary: "text-primary",
    destructive: "text-destructive",
    success: "text-green-600",
    warning: "text-yellow-600",
  };

  return (
    <span
      className={cn("inline-flex items-center justify-center", sizeClasses[size], variantClasses[variant], className)}
      {...props}
    >
      <IconComponent className="h-full w-full" />
    </span>
  );
}
