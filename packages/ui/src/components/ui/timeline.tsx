import * as React from "react";
import { cn } from "@/lib/utils";

export interface TimelineItem {
  title: string;
  description?: string;
  date?: string;
  icon?: React.ReactNode;
  status?: "completed" | "current" | "upcoming";
}

export interface TimelineProps {
  items: TimelineItem[];
  orientation?: "vertical" | "horizontal";
  className?: string;
}

export function Timeline({ items, orientation = "vertical", className }: TimelineProps) {
  return (
    <div className={cn("flex", orientation === "vertical" ? "flex-col" : "flex-row", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className={cn("relative flex", orientation === "vertical" ? "flex-row" : "flex-col")}>
            {/* Timeline Line */}
            {!isLast && (
              <div
                className={cn(
                  "bg-border absolute",
                  orientation === "vertical" ? "top-8 left-4 h-full w-0.5" : "top-4 left-8 h-0.5 w-full"
                )}
              />
            )}

            {/* Timeline Dot */}
            <div
              className={cn(
                "bg-background relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2",
                item.status === "completed" && "border-primary bg-primary text-primary-foreground",
                item.status === "current" && "border-primary bg-background text-primary",
                item.status === "upcoming" && "border-muted-foreground bg-background text-muted-foreground",
                !item.status && "border-muted-foreground bg-background text-muted-foreground"
              )}
            >
              {item.icon ? item.icon : <div className="h-2 w-2 rounded-full bg-current" />}
            </div>

            {/* Timeline Content */}
            <div className={cn("flex-1", orientation === "vertical" ? "ml-4 pb-8" : "mt-2 text-center")}>
              <div
                className={cn(
                  "font-medium",
                  item.status === "completed" && "text-primary",
                  item.status === "current" && "text-foreground",
                  item.status === "upcoming" && "text-muted-foreground",
                  !item.status && "text-foreground"
                )}
              >
                {item.title}
              </div>
              {item.description && <div className="text-muted-foreground text-sm">{item.description}</div>}
              {item.date && <div className="text-muted-foreground text-xs">{item.date}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
