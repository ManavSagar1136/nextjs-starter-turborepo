import * as React from "react";
import { cn } from "../../lib/utils";

export interface SidebarLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  sidebar?: React.ReactNode;
  sidebarWidth?: "sm" | "md" | "lg" | "xl";
  sidebarPosition?: "left" | "right";
  children: React.ReactNode;
}

export function SidebarLayout({
  sidebar,
  sidebarWidth = "md",
  sidebarPosition = "left",
  className,
  children,
  ...props
}: SidebarLayoutProps) {
  const sidebarWidthClasses = {
    sm: "w-48",
    md: "w-64",
    lg: "w-80",
    xl: "w-96",
  };

  return (
    <div className={cn("flex h-full", sidebarPosition === "right" && "flex-row-reverse", className)} {...props}>
      {sidebar && (
        <aside
          className={cn(
            "border-border bg-muted/50 flex-shrink-0 border-r",
            sidebarWidthClasses[sidebarWidth],
            sidebarPosition === "right" && "border-r-0 border-l"
          )}
        >
          {sidebar}
        </aside>
      )}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
