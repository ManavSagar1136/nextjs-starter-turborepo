"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { AnimatePresence, HTMLMotionProps, motion } from "framer-motion";

import { cn } from "@buildbase/ui/lib/utils";

interface AnimatedSubscribeButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  isSubscribed?: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

export const AnimatedSubscribeButton = React.forwardRef<HTMLButtonElement, AnimatedSubscribeButtonProps>(
  ({ isSubscribed = false, onClick, className, children, disabled, isLoading, ...props }, ref) => {
    if (
      React.Children.count(children) !== 2 ||
      !React.Children.toArray(children).every(child => React.isValidElement(child) && child.type === "span")
    ) {
      throw new Error("AnimatedSubscribeButton expects two children, both of which must be <span> elements.");
    }

    const childrenArray = React.Children.toArray(children);
    const initialChild = childrenArray[0];
    const changeChild = childrenArray[1];

    return (
      <AnimatePresence mode="wait">
        {isSubscribed ? (
          <motion.button
            ref={ref}
            className={cn(
              "bg-brand-500 relative flex h-10 w-fit items-center justify-center overflow-hidden rounded-full px-6 text-white",
              className
            )}
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              onClick?.(e);
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            disabled={disabled || isLoading}
            {...props}
          >
            <motion.span
              key="action"
              className="relative flex h-full w-full items-center justify-center font-semibold"
              initial={{ y: -50 }}
              animate={{ y: 0 }}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <>{changeChild}</>}
            </motion.span>
          </motion.button>
        ) : (
          <motion.button
            ref={ref}
            className={cn(
              "bg-brand-500 relative flex h-10 w-fit cursor-pointer items-center justify-center rounded-full border-none px-6 text-white",
              className
            )}
            onClick={e => {
              onClick?.(e);
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            disabled={disabled || isLoading}
            {...props}
          >
            <motion.span
              key="reaction"
              className="relative flex items-center justify-center font-semibold"
              initial={{ x: 0 }}
              exit={{ x: 50, transition: { duration: 0.1 } }}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <>{initialChild}</>}
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>
    );
  }
);

AnimatedSubscribeButton.displayName = "AnimatedSubscribeButton";
