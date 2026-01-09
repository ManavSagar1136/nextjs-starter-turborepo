import * as React from "react";
import { cn } from "@/lib/utils";

export interface ColumnsProps extends React.HTMLAttributes<HTMLDivElement> {
  count?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 56 | 64;
  children: React.ReactNode;
}

export interface ColumnProps extends React.HTMLAttributes<HTMLDivElement> {
  span?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  children: React.ReactNode;
}

export function Columns({ count = 1, gap = 4, className, children, ...props }: ColumnsProps) {
  const countClasses = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
    12: "grid-cols-12",
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

export function Column({ span = 1, className, children, ...props }: ColumnProps) {
  const spanClasses = {
    1: "col-span-1",
    2: "col-span-2",
    3: "col-span-3",
    4: "col-span-4",
    5: "col-span-5",
    6: "col-span-6",
    12: "col-span-12",
  };

  return (
    <div className={cn(spanClasses[span], className)} {...props}>
      {children}
    </div>
  );
}
