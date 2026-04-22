// v1.0.0
// Default reveal-on-scroll primitive for marketing sections.
// Reads from globals.css tokens via Tailwind utilities passed by callers;
// this component contributes no styling of its own.
//
// Default behavior: fade-and-rise on first view, once only, with a viewport
// margin that triggers slightly before the section is fully on screen.
// Pass `variants={staggerContainer}` and put `MotionSection.Item` children
// inside when you want staggered reveals.

"use client";

import { motion, type MotionProps, type Variants } from "framer-motion";
import { forwardRef, type ElementType, type ReactNode } from "react";

import { fadeUp, staggerItem } from "@/lib/motion/variants";

type MotionSectionProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  variants?: Variants;
  amount?: number;
  margin?: string;
  once?: boolean;
  id?: string;
  "aria-labelledby"?: string;
  "aria-label"?: string;
} & Omit<MotionProps, "variants">;

const MotionSectionRoot = forwardRef<HTMLElement, MotionSectionProps>(
  function MotionSectionRoot(
    {
      as = "section",
      children,
      className,
      variants = fadeUp,
      amount = 0.2,
      margin = "0px 0px -10% 0px",
      once = true,
      ...rest
    },
    ref,
  ) {
    const Tag = motion(as);

    return (
      <Tag
        ref={ref}
        className={className}
        initial="hidden"
        whileInView="visible"
        viewport={{ once, amount, margin }}
        variants={variants}
        {...rest}
      >
        {children}
      </Tag>
    );
  },
);

type MotionItemProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  variants?: Variants;
} & Omit<MotionProps, "variants">;

function MotionSectionItem({
  as = "div",
  children,
  className,
  variants = staggerItem,
  ...rest
}: MotionItemProps) {
  const Tag = motion(as);
  return (
    <Tag className={className} variants={variants} {...rest}>
      {children}
    </Tag>
  );
}

export const MotionSection = Object.assign(MotionSectionRoot, {
  Item: MotionSectionItem,
});
