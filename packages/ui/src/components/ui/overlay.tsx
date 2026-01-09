import * as React from "react";
import { cn } from "@/lib/utils";

export interface OverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  visible?: boolean;
  blur?: boolean;
  opacity?: "light" | "medium" | "dark";
  children: React.ReactNode;
}

export function Overlay({
  visible = true,
  blur = false,
  opacity = "medium",
  className,
  children,
  ...props
}: OverlayProps) {
  const opacityClasses = {
    light: "bg-black/20",
    medium: "bg-black/50",
    dark: "bg-black/80",
  };

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        opacityClasses[opacity],
        blur && "backdrop-blur-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
