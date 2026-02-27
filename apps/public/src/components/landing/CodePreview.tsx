"use client";

import { motion, useReducedMotion } from "framer-motion";

import { CODE_PREVIEW } from "@/data/landing";
import { getMotionVariant, fadeUp } from "@/lib/animation-variants";

function syntaxHighlight(code: string) {
  return code.split("\n").map((line, i) => {
    let highlighted = line;

    // Comments
    if (line.trimStart().startsWith("//")) {
      return (
        <span key={i} className="text-slate-400 dark:text-slate-600">
          {highlighted}
        </span>
      );
    }

    // Keywords
    highlighted = highlighted
      .replace(
        /\b(model|String|Boolean|DateTime|Int|Float)\b/g,
        '<k>$1</k>'
      )
      .replace(
        /(@id|@default|@unique|@relation|@db\.Text|@updatedAt)/g,
        '<a>$1</a>'
      )
      .replace(
        /(cuid|now|false|true)/g,
        '<f>$1</f>'
      );

    // Parse tags into spans
    const parts = highlighted.split(/(<k>.*?<\/k>|<a>.*?<\/a>|<f>.*?<\/f>)/g);

    return (
      <span key={i}>
        {parts.map((part, j) => {
          if (part.startsWith("<k>")) {
            return (
              <span key={j} style={{ color: "#818CF8" }}>
                {part.replace(/<\/?k>/g, "")}
              </span>
            );
          }
          if (part.startsWith("<a>")) {
            return (
              <span key={j} style={{ color: "#06B6D4" }}>
                {part.replace(/<\/?a>/g, "")}
              </span>
            );
          }
          if (part.startsWith("<f>")) {
            return (
              <span key={j} style={{ color: "#10B981" }}>
                {part.replace(/<\/?f>/g, "")}
              </span>
            );
          }
          return <span key={j} className="text-slate-600 dark:text-slate-400">{part}</span>;
        })}
      </span>
    );
  });
}

export function CodePreview() {
  const shouldReduce = useReducedMotion();
  const headlineVariant = getMotionVariant(shouldReduce, fadeUp);
  const codeVariant = getMotionVariant(shouldReduce, fadeUp);

  const lines = syntaxHighlight(CODE_PREVIEW);

  return (
    <section
      id="code-preview"
      className="w-full py-20 md:py-32 px-5 md:px-20 bg-white dark:bg-dark-surface"
      aria-labelledby="code-heading"
    >
      <div className="mx-auto w-full max-w-[1280px]">
        {/* Header */}
        <motion.div
          variants={headlineVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mb-12 text-center"
        >
          <span className="mk-eyebrow mb-3 block">Developer Experience</span>
          <h2
            id="code-heading"
            className="font-bold leading-tight text-3xl md:text-4xl text-slate-900 dark:text-slate-50"
          >
            Define your content. <span className="mk-gradient-text">Ship it.</span>
          </h2>
          <p
            className="mx-auto mt-4 max-w-[560px] leading-relaxed text-base text-slate-600 dark:text-slate-400"
          >
            Type-safe content models powered by Prisma. Your schema becomes your API,
            your types, and your admin forms — automatically.
          </p>
        </motion.div>

        {/* Code block */}
        <motion.div
          variants={codeVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto max-w-[720px]"
        >
          <div
            className="overflow-hidden rounded-[20px] border bg-slate-50 dark:bg-dark-surface-secondary"
            style={{
              borderColor: "rgba(99, 102, 241, 0.2)",
            }}
          >
            {/* Terminal header */}
            <div
              className="flex items-center gap-2 border-b px-4 py-3 border-slate-200 dark:border-slate-800"
            >
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full" style={{ background: "#EF4444" }} />
                <div className="h-3 w-3 rounded-full" style={{ background: "#F59E0B" }} />
                <div className="h-3 w-3 rounded-full" style={{ background: "#10B981" }} />
              </div>
              <span
                className="ml-2 font-mono text-xs text-slate-400 dark:text-slate-600"
              >
                schema.prisma
              </span>
            </div>

            {/* Code content */}
            <pre
              className="overflow-x-auto p-6 font-mono text-sm leading-relaxed text-slate-600 dark:text-slate-400"
            >
              <code>
                {lines.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </code>
            </pre>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
