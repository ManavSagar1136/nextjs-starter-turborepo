/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

// Optional react-svg import - component will work without it for non-SVG string icons
let ReactSVG: any = null;
try {
  ReactSVG = require("react-svg").ReactSVG;
} catch {
  // react-svg not installed, will handle SVG strings differently
}

declare global {
  /**
   * Represents a valid icon input for {@link CustomSVG}.
   * Can be a string (SVG file path) or a React element.
   */
  type ICustomSvgIconType = LucideIcon | string | React.ReactNode | React.ComponentType<React.SVGProps<SVGSVGElement>>;

  /**
   * Props for the {@link CustomSVG} component.
   */
  interface ICustomSvgProps extends React.HTMLAttributes<HTMLDivElement> {
    icon: ICustomSvgIconType;
    svgClassName?: string;
  }
}

/**
 * A flexible SVG icon wrapper component that supports both inline React elements
 * and external `.svg` file paths via {@link ReactSVG}.
 *
 * The component applies default styling to center the icon and optionally modifies
 * the SVG before injection (e.g., applying class names and removing the `xmlns` attribute).
 *
 * @param props - SVG Component props, see {@link ICustomSvgProps}.
 *
 * @returns A rendered SVG or React node wrapped in a `div`, or a `ReactSVG` wrapper for `.svg` strings.
 */
export const CustomSVG: React.FC<ICustomSvgProps> = ({ icon, svgClassName, className, ...rest }) => {
  // Handle null/undefined
  if (!icon) {
    console.warn("CustomSVG: No icon provided");
    return null;
  }

  // Check if icon is a string (SVG file path)
  if (typeof icon === "string") {
    if (icon.endsWith(".svg")) {
      // If react-svg is available, use it
      if (ReactSVG) {
        return (
          <ReactSVG
            src={icon}
            beforeInjection={(svg: SVGElement) => {
              if (svgClassName) {
                svg.classList.add(...svgClassName.split(" "));
              }
              svg.removeAttribute("xmlns");
            }}
            loading={() => <svg className={cn(className)}></svg>}
            className={cn(className)}
          />
        );
      }
      // Fallback: render as img if react-svg is not available
      return (
        <div {...rest} className={cn("inline-flex items-center justify-center", className)}>
          <img src={icon} alt="" className={svgClassName} />
        </div>
      );
    }
    // String but not .svg - render as text (shouldn't happen normally)
    return (
      <div {...rest} className={cn("inline-flex items-center justify-center", className)}>
        {icon}
      </div>
    );
  }

  // Check if icon is already a valid React element
  if (React.isValidElement(icon)) {
    return (
      <div {...rest} className={cn("inline-flex items-center justify-center", className)}>
        {icon}
      </div>
    );
  }

  // Check if icon is a React component
  // This handles:
  // - Function components (typeof icon === "function")
  // - forwardRef components (objects with $$typeof and render, like Lucide icons)
  // - Memo components (objects with $$typeof)
  const isReactComponent =
    typeof icon === "function" ||
    (icon &&
      typeof icon === "object" &&
      icon !== null &&
      ("render" in icon || "$$typeof" in icon || ("type" in icon && typeof (icon as any).type === "function")));

  if (isReactComponent) {
    const IconComponent = icon as React.ComponentType<React.SVGProps<SVGSVGElement>>;
    return (
      <div {...rest} className={cn("inline-flex items-center justify-center", className)}>
        <IconComponent className={svgClassName} />
      </div>
    );
  }

  // Fallback - return null if icon is not a valid type
  console.warn("CustomSVG: Invalid icon type", typeof icon, icon);
  return null;
};
