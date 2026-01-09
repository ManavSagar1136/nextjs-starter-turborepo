import * as React from "react";
import { cn } from "@/lib/utils";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  children: React.ReactNode;
}

export function Section({ size = "md", className, children, ...props }: SectionProps) {
  const sizeClasses = {
    sm: "py-8",
    md: "py-12",
    lg: "py-16",
    xl: "py-20",
    "2xl": "py-24",
  };

  return (
    <section className={cn("w-full", sizeClasses[size], className)} {...props}>
      {children}
    </section>
  );
}
