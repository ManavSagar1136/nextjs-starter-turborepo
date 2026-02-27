"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

import { STATS } from "@/data/landing";
import { getMotionVariant, fadeUp, staggerContainer } from "@/lib/animation-variants";

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const shouldReduce = useReducedMotion();

  useEffect(() => {
    if (!isInView) return;
    if (shouldReduce) {
      setCount(value);
      return;
    }

    let start = 0;
    const duration = 1500;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.floor(eased * value);
      setCount(start);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [isInView, value, shouldReduce]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

export function StatsBar() {
  const shouldReduce = useReducedMotion();
  const containerVariant = getMotionVariant(shouldReduce, staggerContainer);
  const itemVariant = getMotionVariant(shouldReduce, fadeUp);

  return (
    <section
      className="w-full px-[var(--mk-section-x)]"
      style={{ background: "var(--mk-bg-primary)" }}
      aria-label="Key metrics"
    >
      <motion.div
        variants={containerVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center justify-center gap-8 py-16 sm:gap-12 md:gap-16 lg:justify-between"
      >
        {STATS.map((stat) => (
          <motion.div
            key={stat.label}
            variants={itemVariant}
            className="flex flex-col items-center gap-1 text-center"
          >
            <span
              className="font-extrabold"
              style={{ fontSize: "var(--mk-text-3xl)", color: "var(--mk-text-primary)" }}
            >
              <AnimatedCounter value={stat.value} suffix={stat.suffix} />
            </span>
            <span
              className="font-medium uppercase tracking-widest"
              style={{ fontSize: "var(--mk-text-xs)", color: "var(--mk-text-muted)" }}
            >
              {stat.label}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
