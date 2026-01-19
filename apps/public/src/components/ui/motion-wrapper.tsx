/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { forwardRef, JSX as JSXNamespace } from "react";
import { motion, MotionProps, Variant, Variants } from "framer-motion";

import { cn } from "@buildbase/ui/lib/utils";

/**
 * Predefined animation presets used to configure motion variants.
 */
const PRESETS = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  slideUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
  slideDown: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
  },
  slideLeft: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
  },
  slideRight: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  },
  rotate: {
    hidden: { opacity: 0, rotate: -180 },
    visible: { opacity: 1, rotate: 0 },
  },
};

/**
 * Type representing a preset key or an array of preset keys.
 */
type Preset = keyof typeof PRESETS | (keyof typeof PRESETS)[];

/**
 * Props for the {@link MotionWrapper} component.
 */
interface IMotionWrapperProps extends MotionProps {
  children?: React.ReactNode;
  as?: keyof JSXNamespace.IntrinsicElements;
  className?: string;
  preset?: Preset;
  customVariants?: Variants;
  customInitial?: Variant | string;
  customAnimate?: Variant | string;
  customExit?: Variant | string;
  transition?: MotionProps["transition"];
  delay?: number;
  duration?: number;
  viewportOnce?: boolean;
  viewportAmount?: number | "some" | "all";
  viewportMargin?: string;
  elementProps?: React.HTMLAttributes<HTMLElement>;
  animateOnMount?: boolean;
}

/**
 * Merges multiple animation presets into a single variants object.
 *
 * @param presets - An array of preset names to combine.
 * @returns Combined motion variants with merged `hidden` and `visible` states.
 */
function mergeVariants(presets: (keyof typeof PRESETS)[]): Variants {
  return presets.reduce(
    (acc, key) => {
      const variant = PRESETS[key];
      if (variant) {
        acc.hidden = { ...acc.hidden, ...variant.hidden };
        acc.visible = { ...acc.visible, ...variant.visible };
      }
      return acc;
    },
    { hidden: {}, visible: {} } as Variants,
  );
}

/**
 * A reusable animation wrapper component built with Framer Motion.
 * It allows applying standard or custom animation presets to any HTML element
 * when it enters the viewport.
 *
 * @remarks
 * This component is flexible and supports preset-based animations,
 * custom variants, and viewport-based triggering.
 *
 * @param props - Component props defined in {@link IMotionWrapperProps}.
 * @returns A motion-wrapped React component.
 */
const MotionWrapper = forwardRef<HTMLElement, IMotionWrapperProps>(
  (
    {
      children,
      as = "div",
      preset,
      customVariants,
      customInitial,
      customAnimate,
      customExit,
      className,
      transition,
      delay = 0,
      duration = 0.5,
      viewportOnce = true,
      viewportAmount = 0.1,
      viewportMargin = "0px",
      elementProps,
      animateOnMount = true,
      ...rest
    },
    ref,
  ) => {
    const selectedVariants: Variants | undefined = Array.isArray(preset)
      ? mergeVariants(preset)
      : preset
        ? PRESETS[preset]
        : customVariants;

    const MotionComponent: React.ElementType =
      (motion as any)[as] || motion.div;

    const animateValue = customAnimate ?? "visible";

    return (
      <MotionComponent
        ref={ref}
        initial={customInitial ?? "hidden"}
        animate={animateOnMount ? animateValue : undefined}
        whileInView={animateOnMount ? undefined : animateValue}
        exit={customExit}
        variants={selectedVariants}
        viewport={
          animateOnMount
            ? undefined
            : {
                once: viewportOnce,
                amount: viewportAmount,
                margin: viewportMargin,
              }
        }
        transition={{
          ...transition,
          delay,
          duration,
        }}
        className={cn(className)}
        {...elementProps}
        {...rest}
      >
        {children}
      </MotionComponent>
    );
  },
);

MotionWrapper.displayName = "MotionWrapper";

export { MotionWrapper };
