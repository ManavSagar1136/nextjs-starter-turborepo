"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: keyof React.JSX.IntrinsicElements;
  children: React.ReactNode;
}

export function Box({ as: Component = "div", className, children, ...props }: BoxProps) {
  return React.createElement(
    Component,
    {
      className: cn(className),
      ...props,
    },
    children
  );
}
