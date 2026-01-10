import * as React from "react";
import { cn } from "../../lib/utils";

export interface CenterProps extends React.HTMLAttributes<HTMLDivElement> {
  inline?: boolean;
  children: React.ReactNode;
}

export function Center({ inline = false, className, children, ...props }: CenterProps) {
  return (
    <div
      className={cn("flex items-center justify-center", inline ? "inline-flex" : "h-full w-full", className)}
      {...props}
    >
      {children}
    </div>
  );
}
