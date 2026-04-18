"use client";

import { cn } from "@buildbase/ui/lib/utils";

interface AppIconProps {
  /**
   * Size of the main icon container
   * @default "lg"
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl";

  /**
   * Custom className for the container
   */
  className?: string;
}

export const AppIcon = ({ size = "lg", className }: AppIconProps) => {
  const sizeClasses = {
    xs: {
      container: "h-12 w-12",
      icon: 24,
      corner: "h-4 w-4",
      cornerIcon: 8,
      cornerOffset: "-left-0.5 -top-0.5",
    },
    sm: {
      container: "h-16 w-16",
      icon: 32,
      corner: "h-5 w-5",
      cornerIcon: 12,
      cornerOffset: "-left-1 -top-1",
    },
    md: {
      container: "h-20 w-20",
      icon: 40,
      corner: "h-5 w-5",
      cornerIcon: 12,
      cornerOffset: "-left-1.5 -top-1.5",
    },
    lg: {
      container: "h-24 w-24",
      icon: 48,
      corner: "h-6 w-6",
      cornerIcon: 14,
      cornerOffset: "-left-2 -top-2",
    },
    xl: {
      container: "h-32 w-32",
      icon: 64,
      corner: "h-8 w-8",
      cornerIcon: 18,
      cornerOffset: "-left-3 -top-3",
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={className}>
      <div className={cn("flex items-center justify-center overflow-hidden rounded-xl", sizes.container)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/favicon-192x192.png"
          alt="App icon"
          width={sizes.icon}
          height={sizes.icon}
          className="object-contain"
        />
      </div>
    </div>
  );
};

export default AppIcon;
