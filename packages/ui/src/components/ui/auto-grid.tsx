import * as React from "react";
import { cn } from "@/lib/utils";

export interface AutoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  minItemWidth?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 56 | 64;
  children: React.ReactNode;
}

export function AutoGrid({ minItemWidth = "md", gap = 4, className, children, ...props }: AutoGridProps) {
  const minItemWidthClasses = {
    xs: "grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]",
    sm: "grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]",
    md: "grid-cols-[repeat(auto-fit,minmax(20rem,1fr))]",
    lg: "grid-cols-[repeat(auto-fit,minmax(24rem,1fr))]",
    xl: "grid-cols-[repeat(auto-fit,minmax(28rem,1fr))]",
    "2xl": "grid-cols-[repeat(auto-fit,minmax(32rem,1fr))]",
    "3xl": "grid-cols-[repeat(auto-fit,minmax(36rem,1fr))]",
    "4xl": "grid-cols-[repeat(auto-fit,minmax(40rem,1fr))]",
  };

  const gapClasses = {
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
    <div className={cn("grid", minItemWidthClasses[minItemWidth], gapClasses[gap], className)} {...props}>
      {children}
    </div>
  );
}
