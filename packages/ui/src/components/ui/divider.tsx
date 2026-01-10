import * as React from "react";
import { cn } from "../../lib/utils";

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  variant?: "solid" | "dashed" | "dotted";
  thickness?: "thin" | "medium" | "thick";
  children?: React.ReactNode;
}

export function Divider({
  orientation = "horizontal",
  variant = "solid",
  thickness = "thin",
  className,
  children,
  ...props
}: DividerProps) {
  const orientationClasses = {
    horizontal: "w-full",
    vertical: "h-full w-px",
  };

  const variantClasses = {
    solid: "border-solid",
    dashed: "border-dashed",
    dotted: "border-dotted",
  };

  const thicknessClasses = {
    thin: "border-t",
    medium: "border-t-2",
    thick: "border-t-4",
  };

  if (children) {
    return (
      <div className={cn("relative flex items-center", className)} {...props}>
        <div className={cn("flex-grow", thicknessClasses[thickness], variantClasses[variant], "border-border")} />
        <div className="text-muted-foreground px-4 text-sm">{children}</div>
        <div className={cn("flex-grow", thicknessClasses[thickness], variantClasses[variant], "border-border")} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border-border",
        orientationClasses[orientation],
        variantClasses[variant],
        thicknessClasses[thickness],
        className
      )}
      {...props}
    />
  );
}
