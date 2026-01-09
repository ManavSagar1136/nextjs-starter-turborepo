import * as React from "react";
import { cn } from "@/lib/utils";

export interface BackdropProps extends React.HTMLAttributes<HTMLDivElement> {
  visible?: boolean;
  blur?: boolean;
  opacity?: "light" | "medium" | "dark";
  onClick?: () => void;
}

export function Backdrop({
  visible = true,
  blur = false,
  opacity = "medium",
  onClick,
  className,
  ...props
}: BackdropProps) {
  const opacityClasses = {
    light: "bg-black/20",
    medium: "bg-black/50",
    dark: "bg-black/80",
  };

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-40",
        opacityClasses[opacity],
        blur && "backdrop-blur-sm",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      {...props}
    />
  );
}
