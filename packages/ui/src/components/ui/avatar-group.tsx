import * as React from "react";
import { cn } from "../../lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  avatars: {
    src?: string;
    alt?: string;
    fallback: string;
  }[];
  max?: number;
  size?: "sm" | "md" | "lg" | "xl";
  spacing?: "sm" | "md" | "lg";
}

export function AvatarGroup({ avatars, max = 3, size = "md", spacing = "sm", className, ...props }: AvatarGroupProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
    xl: "h-12 w-12",
  };

  const spacingClasses = {
    sm: "-space-x-1",
    md: "-space-x-2",
    lg: "-space-x-3",
  };

  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <div className={cn("flex items-center", spacingClasses[spacing], className)} {...props}>
      {visibleAvatars.map((avatar, index) => (
        <Avatar key={index} className={cn(sizeClasses[size], "border-background border-2")}>
          <AvatarImage src={avatar.src} alt={avatar.alt} />
          <AvatarFallback className="text-xs">{avatar.fallback}</AvatarFallback>
        </Avatar>
      ))}
      {remainingCount > 0 && (
        <Avatar className={cn(sizeClasses[size], "border-background bg-muted border-2")}>
          <AvatarFallback className="text-xs">+{remainingCount}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
