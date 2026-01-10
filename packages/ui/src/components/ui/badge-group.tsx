import * as React from "react";
import { cn } from "../../lib/utils";
import { Badge } from "@/components/ui/badge";

export interface BadgeGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  badges: {
    label: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  }[];
  max?: number;
  spacing?: "sm" | "md" | "lg";
}

export function BadgeGroup({ badges, max, spacing = "sm", className, ...props }: BadgeGroupProps) {
  const spacingClasses = {
    sm: "gap-1",
    md: "gap-2",
    lg: "gap-3",
  };

  const visibleBadges = max ? badges.slice(0, max) : badges;
  const remainingCount = max ? badges.length - max : 0;

  return (
    <div className={cn("flex flex-wrap items-center", spacingClasses[spacing], className)} {...props}>
      {visibleBadges.map((badge, index) => (
        <Badge key={index} variant={badge.variant}>
          {badge.label}
        </Badge>
      ))}
      {remainingCount > 0 && <Badge variant="outline">+{remainingCount}</Badge>}
    </div>
  );
}
