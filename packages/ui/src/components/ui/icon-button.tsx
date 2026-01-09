import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  "aria-label": string;
}

export function IconButton({
  icon: IconComponent,
  size = "md",
  variant = "default",
  className,
  ...props
}: IconButtonProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const iconSizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <Button variant={variant} size="icon" className={cn(sizeClasses[size], className)} {...props}>
      <IconComponent className={iconSizeClasses[size]} />
    </Button>
  );
}
