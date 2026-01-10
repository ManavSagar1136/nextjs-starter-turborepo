import * as React from "react";
import { cn } from "../../lib/utils";
import { Button } from "@/components/ui/button";

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  buttons: {
    label: string;
    onClick?: () => void;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    disabled?: boolean;
  }[];
  orientation?: "horizontal" | "vertical";
  size?: "default" | "sm" | "lg" | "icon";
  attached?: boolean;
}

export function ButtonGroup({
  buttons,
  orientation = "horizontal",
  size = "default",
  attached = false,
  className,
  ...props
}: ButtonGroupProps) {
  const orientationClasses = {
    horizontal: "flex-row",
    vertical: "flex-col",
  };

  const attachedClasses = attached
    ? {
        horizontal:
          "[&>button:not(:first-child)]:rounded-l-none [&>button:not(:last-child)]:rounded-r-none [&>button:not(:first-child)]:border-l-0",
        vertical:
          "[&>button:not(:first-child)]:rounded-t-none [&>button:not(:last-child)]:rounded-b-none [&>button:not(:first-child)]:border-t-0",
      }
    : {};

  return (
    <div
      className={cn("flex", orientationClasses[orientation], attached && attachedClasses[orientation], className)}
      {...props}
    >
      {buttons.map((button, index) => (
        <Button key={index} variant={button.variant} size={size} disabled={button.disabled} onClick={button.onClick}>
          {button.label}
        </Button>
      ))}
    </div>
  );
}
