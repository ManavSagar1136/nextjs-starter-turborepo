import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface InputGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  leftButton?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  };
  rightButton?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  };
  children: React.ReactNode;
}

export function InputGroup({
  leftAddon,
  rightAddon,
  leftButton,
  rightButton,
  className,
  children,
  ...props
}: InputGroupProps) {
  return (
    <div className={cn("flex items-center", className)} {...props}>
      {leftAddon && (
        <div className="border-input bg-muted text-muted-foreground flex items-center rounded-l-md border border-r-0 px-3 py-2">
          {leftAddon}
        </div>
      )}
      {leftButton && (
        <Button
          variant={leftButton.variant || "outline"}
          onClick={leftButton.onClick}
          className="rounded-r-none border-r-0"
        >
          {leftButton.label}
        </Button>
      )}
      <div className="flex-1">{children}</div>
      {rightButton && (
        <Button
          variant={rightButton.variant || "outline"}
          onClick={rightButton.onClick}
          className="rounded-l-none border-l-0"
        >
          {rightButton.label}
        </Button>
      )}
      {rightAddon && (
        <div className="border-input bg-muted text-muted-foreground flex items-center rounded-r-md border border-l-0 px-3 py-2">
          {rightAddon}
        </div>
      )}
    </div>
  );
}
