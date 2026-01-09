import * as React from "react";
import { cn } from "@/lib/utils";

export interface AspectProps extends React.HTMLAttributes<HTMLDivElement> {
  ratio?: "square" | "video" | "photo" | "wide" | "ultra-wide" | number;
  children: React.ReactNode;
}

export function Aspect({ ratio = "square", className, children, ...props }: AspectProps) {
  const ratioClasses = {
    square: "aspect-square",
    video: "aspect-video",
    photo: "aspect-[4/3]",
    wide: "aspect-[16/9]",
    "ultra-wide": "aspect-[21/9]",
  };

  const customRatio = typeof ratio === "number" ? { aspectRatio: ratio } : {};

  return (
    <div
      className={cn("relative w-full overflow-hidden", typeof ratio === "string" && ratioClasses[ratio], className)}
      style={customRatio}
      {...props}
    >
      {children}
    </div>
  );
}
