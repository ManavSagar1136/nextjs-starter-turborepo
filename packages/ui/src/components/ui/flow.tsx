import * as React from "react";
import { cn } from "../../lib/utils";

export interface FlowProps extends React.HTMLAttributes<HTMLDivElement> {
  space?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 56 | 64;
  children: React.ReactNode;
}

export function Flow({ space = 4, className, children, ...props }: FlowProps) {
  const spaceClasses = {
    0: "space-y-0",
    1: "space-y-1",
    2: "space-y-2",
    3: "space-y-3",
    4: "space-y-4",
    5: "space-y-5",
    6: "space-y-6",
    8: "space-y-8",
    10: "space-y-10",
    12: "space-y-12",
    16: "space-y-16",
    20: "space-y-20",
    24: "space-y-24",
    32: "space-y-32",
    40: "space-y-40",
    48: "space-y-48",
    56: "space-y-56",
    64: "space-y-64",
  };

  return (
    <div className={cn(spaceClasses[space], className)} {...props}>
      {children}
    </div>
  );
}
