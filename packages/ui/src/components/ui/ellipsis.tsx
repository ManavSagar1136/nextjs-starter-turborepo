import * as React from "react";
import { cn } from "../../lib/utils";

export interface EllipsisProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Ellipsis({ className, children, ...props }: EllipsisProps) {
  return (
    <div className={cn("truncate", className)} {...props}>
      {children}
    </div>
  );
}
