"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Mail } from "lucide-react";

import { Accordion } from "@buildbase/ui/accordion";

import { SiteConfig } from "@/config";
import { getMotionVariant, fadeUp } from "@/lib/animation-variants";

import { FAQQuestion, FAQQuestionProps } from "./FAQquestion";

export const FAQ = ({ faqs }: { faqs: FAQQuestionProps[] }) => {
  const shouldReduce = useReducedMotion();
  const headlineVariant = getMotionVariant(shouldReduce, fadeUp);
  const contentVariant = getMotionVariant(shouldReduce, fadeUp);

  const handleContactSupport = () => {
    window.location.href = `mailto:${SiteConfig.supportEmail}`;
  };

  return (
    <section
      id="faq"
      className="w-full py-[var(--mk-section-y)] px-[var(--mk-section-x)]"
      style={{ background: "var(--mk-bg-secondary)" }}
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-[720px]">
        {/* Header */}
        <motion.div
          variants={headlineVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mb-12 text-center"
        >
          <span className="mk-eyebrow mb-3 block">FAQ</span>
          <h2
            id="faq-heading"
            className="font-bold leading-tight"
            style={{ fontSize: "var(--mk-text-3xl)", color: "var(--mk-text-primary)" }}
          >
            Frequently asked <span className="mk-gradient-text">questions.</span>
          </h2>
          <p
            className="mx-auto mt-4 max-w-[480px] leading-relaxed"
            style={{ fontSize: "var(--mk-text-base)", color: "var(--mk-text-secondary)" }}
          >
            Everything you need to know about the CMS monorepo template.
          </p>
        </motion.div>

        {/* Accordion */}
        <motion.div
          variants={contentVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <Accordion
            type="single"
            collapsible
            className="w-full"
            aria-label="Frequently asked questions"
          >
            {faqs.map((data, index) => (
              <FAQQuestion {...data} key={`faq-item-${index}`} />
            ))}
          </Accordion>
        </motion.div>

        {/* Contact support */}
        <motion.div
          variants={contentVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="mt-10 border-t pt-6 text-center"
          style={{ borderColor: "var(--mk-border)" }}
        >
          <p
            className="mb-4 text-sm"
            style={{ color: "var(--mk-text-muted)" }}
          >
            Still have questions?
          </p>
          <button
            onClick={handleContactSupport}
            className="inline-flex items-center gap-2 rounded-[var(--mk-radius-sm)] border border-[var(--mk-border-bright)] px-5 py-2.5 text-sm font-medium text-[var(--mk-text-secondary)] transition-all duration-200 hover:border-[var(--mk-brand)] hover:text-[var(--mk-text-primary)]"
            aria-label="Contact support team"
          >
            <Mail size={16} />
            Contact support
          </button>
        </motion.div>
      </div>
    </section>
  );
};
