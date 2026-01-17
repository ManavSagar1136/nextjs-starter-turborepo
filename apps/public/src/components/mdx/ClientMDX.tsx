"use client";

import { FileX } from "lucide-react";

import MarkdownView from "./MarkdownView";

/**
 * @deprecated - ClientMDX is deprecated. Use MarkdownView instead for rendering MDX content.
 * This component is kept for backward compatibility but will be removed in a future version.
 *
 * Client-only MDX renderer wrapper around MarkdownView.
 *
 * @param code - The MDX/Markdown content string.
 * @param components - Optional overrides for MDX elements (not used, kept for compatibility).
 * @param config - Optional configuration including empty state.
 *
 * @returns A React component that renders MDX content.
 */
export default function ClientMDX({
  code,
  components = {},
  config = {},
}: {
  code: string;
  components?: any;
  config?: {
    empty?: {
      title?: string;
      description?: string;
    };
  };
}) {
  if (!code.trim()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8 text-center">
        <div className="rounded-full bg-muted p-4">
          <FileX className="w-12 h-12 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">
            {config.empty?.title || "Content Not Available"}
          </h3>
          <p className="text-muted-foreground max-w-md">
            {config.empty?.description ||
              "The content for this page is currently unavailable. Please check back later or contact support if this issue persists."}
          </p>
        </div>
      </div>
    );
  }

  return <MarkdownView content={code} />;
}
