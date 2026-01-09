import * as React from "react";
import { cn } from "@/lib/utils";

export interface FrameProps extends React.HTMLAttributes<HTMLDivElement> {
  aspectRatio?: "square" | "video" | "photo" | "wide" | "ultra-wide" | number;
  children: React.ReactNode;
}

export function Frame({ aspectRatio = "square", className, children, ...props }: FrameProps) {
  const aspectRatioClasses = {
    square: "aspect-square",
    video: "aspect-video",
    photo: "aspect-[4/3]",
    wide: "aspect-[16/9]",
    "ultra-wide": "aspect-[21/9]",
  };

  const customAspectRatio = typeof aspectRatio === "number" ? { aspectRatio } : {};

  return (
    <div
      className={cn(
        "border-border bg-muted relative overflow-hidden rounded-lg border",
        typeof aspectRatio === "string" && aspectRatioClasses[aspectRatio],
        className
      )}
      style={customAspectRatio}
      {...props}
    >
      {children}
    </div>
  );
}
