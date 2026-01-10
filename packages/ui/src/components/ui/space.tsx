import * as React from "react";
import { cn } from "../../lib/utils";

export interface SpaceProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 56 | 64;
  direction?: "horizontal" | "vertical";
  children: React.ReactNode;
}

export function Space({ size = 4, direction = "vertical", className, children, ...props }: SpaceProps) {
  const sizeClasses = {
    0: "gap-0",
    1: "gap-1",
    2: "gap-2",
    3: "gap-3",
    4: "gap-4",
    5: "gap-5",
    6: "gap-6",
    8: "gap-8",
    10: "gap-10",
    12: "gap-12",
    16: "gap-16",
    20: "gap-20",
    24: "gap-24",
    32: "gap-32",
    40: "gap-40",
    48: "gap-48",
    56: "gap-56",
    64: "gap-64",
  };

  const directionClasses = {
    horizontal: "flex-row",
    vertical: "flex-col",
  };

  return (
    <div className={cn("flex", directionClasses[direction], sizeClasses[size], className)} {...props}>
      {children}
    </div>
  );
}
