import React from "react";
import { cva, VariantProps } from "class-variance-authority";

import { cn } from "@buildbase/ui/lib/utils";

const wrapperVariants = cva("scroll-parent w-full", {
  variants: {
    variant: {
      default: "space-y-20 md:space-y-28 lg:space-y-40",
    },
    paddingBlock: {
      none: "p-0",
      default: "py-6 lg:py-8",
    },
  },
  defaultVariants: {
    variant: "default",
    paddingBlock: "default",
  },
});

/**
 * Props for the {@link PageWrapper} component.
 */
interface IPageWrapperProps extends VariantProps<typeof wrapperVariants> {
  children: React.ReactNode;
  className?: string;
}

/**
 * A utility wrapper component that applies vertical spacing and padding to its content.
 * Primarily used to structure full-page layouts with consistent section separation.
 *
 * @param props - Component props.
 * @param props.variant - Key from {@link PAGE_WRAPPER_VARIANTS} defining the layout.
 * @param props.children - The content to be rendered within the wrapper.
 *
 * @returns A `div` element with layout-specific styling.
 */
const PageWrapper: React.FC<IPageWrapperProps> = ({
  children,
  variant = "default",
  paddingBlock = "default",
  className,
}) => {
  return (
    <div
      className={cn(
        "scroll-parent w-full",
        wrapperVariants({ variant, paddingBlock }),
        className,
      )}
    >
      {children}
    </div>
  );
};

export { PageWrapper };
