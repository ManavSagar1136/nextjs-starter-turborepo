import * as React from "react";
import { cn } from "@/lib/utils";

export interface RowsProps extends React.HTMLAttributes<HTMLDivElement> {
  count?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 56 | 64;
  children: React.ReactNode;
}

export interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
  span?: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
}

export function Rows({ count = 1, gap = 4, className, children, ...props }: RowsProps) {
  const countClasses = {
    1: "grid-rows-1",
    2: "grid-rows-2",
    3: "grid-rows-3",
    4: "grid-rows-4",
    5: "grid-rows-5",
    6: "grid-rows-6",
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
    <div className={cn("grid", countClasses[count], gapClasses[gap], className)} {...props}>
      {children}
    </div>
  );
}

export function Row({ span = 1, className, children, ...props }: RowProps) {
  const spanClasses = {
    1: "row-span-1",
    2: "row-span-2",
    3: "row-span-3",
    4: "row-span-4",
    5: "row-span-5",
    6: "row-span-6",
  };

  return (
    <div className={cn(spanClasses[span], className)} {...props}>
      {children}
    </div>
  );
}
