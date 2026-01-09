import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const headingVariants = cva("scroll-m-20 font-semibold tracking-tight", {
  variants: {
    variant: {
      h1: "text-4xl lg:text-5xl",
      h2: "text-3xl first:mt-0",
      h3: "text-2xl",
      h4: "text-xl",
      h5: "text-lg",
      h6: "text-base",
    },
  },
  defaultVariants: {
    variant: "h1",
  },
});

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement>, VariantProps<typeof headingVariants> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(({ className, variant, as, ...props }, ref) => {
  const Comp =
    as ||
    (variant === "h1"
      ? "h1"
      : variant === "h2"
        ? "h2"
        : variant === "h3"
          ? "h3"
          : variant === "h4"
            ? "h4"
            : variant === "h5"
              ? "h5"
              : variant === "h6"
                ? "h6"
                : "h1");
  return <Comp className={cn(headingVariants({ variant, className }))} ref={ref} {...props} />;
});
Heading.displayName = "Heading";

export { Heading, headingVariants };
