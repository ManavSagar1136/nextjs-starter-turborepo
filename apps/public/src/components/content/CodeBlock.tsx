"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@buildbase/ui/components/ui/button";

import { cn } from "@buildbase/ui/lib/utils";

interface CodeBlockProps {
  children: string;
  className?: string;
  language?: string;
}

export function CodeBlock({ children, className, language }: CodeBlockProps) {
  const [highlightedCode, setHighlightedCode] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const highlightCode = async () => {
      try {
        const { codeToHtml } = await import("shiki");
        const html = await codeToHtml(children, {
          lang: language || "text",
          theme: "github-dark",
        });
        setHighlightedCode(html);
      } catch (error) {
        console.error("Failed to highlight code:", error);
        // Fallback to plain text
        setHighlightedCode(children);
      }
    };

    if (children) {
      highlightCode();
    }
  }, [children, language]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  };

  return (
    <div className="relative group">
      <div className="absolute right-2 top-2 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      <pre
        className={cn(
          "mb-4 mt-6 overflow-x-auto rounded-lg border !bg-muted dark:!bg-white py-4 px-4 text-foreground",
          className,
        )}
      >
        {highlightedCode ? (
          <code
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
            className="block"
          />
        ) : (
          <code className="block">{children}</code>
        )}
      </pre>
    </div>
  );
}
