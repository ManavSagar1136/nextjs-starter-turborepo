import * as React from "react";
import { cn } from "../../lib/utils";

export interface TruncateProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
  children: React.ReactNode;
}

export function Truncate({ lines = 1, className, children, ...props }: TruncateProps) {
  if (lines === 1) {
    return (
      <div className={cn("truncate", className)} {...props}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn("overflow-hidden", className)}
      style={{
        display: "-webkit-box",
        WebkitLineClamp: lines,
        WebkitBoxOrient: "vertical",
      }}
      {...props}
    >
      {children}
    </div>
  );
}
