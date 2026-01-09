import * as React from "react";
import { cn } from "@/lib/utils";

export interface RepelProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  space?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 56 | 64;
  children: React.ReactNode;
}

export function Repel({ align = "center", space = 4, className, children, ...props }: RepelProps) {
  const alignClasses = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
    baseline: "items-baseline",
  };

  const spaceClasses = {
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

  return (
    <div className={cn("flex justify-between", alignClasses[align], spaceClasses[space], className)} {...props}>
      {children}
    </div>
  );
}
