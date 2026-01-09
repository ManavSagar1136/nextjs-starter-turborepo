import * as React from "react";
import { cn } from "@/lib/utils";

export interface ClusterProps extends React.HTMLAttributes<HTMLDivElement> {
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  space?: "xs" | "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
}

export function Cluster({
  justify = "start",
  align = "center",
  space = "md",
  className,
  children,
  ...props
}: ClusterProps) {
  const justifyClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
    around: "justify-around",
    evenly: "justify-evenly",
  };

  const alignClasses = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
    baseline: "items-baseline",
  };

  const spaceClasses = {
    xs: "gap-1",
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
    xl: "gap-8",
  };

  return (
    <div
      className={cn("flex flex-wrap", justifyClasses[justify], alignClasses[align], spaceClasses[space], className)}
      {...props}
    >
      {children}
    </div>
  );
}
