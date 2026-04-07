"use client";

import { forwardRef } from "react";
import dynamic from "next/dynamic";
import type { MDXEditorMethods } from "@mdxeditor/editor";
import "./editor.css";

const InitializedEditor = dynamic(() => import("./initialized-editor"), {
  ssr: false,
  loading: () => (
    <div className="border-border text-muted-foreground flex min-h-[200px] items-center justify-center rounded-md border text-sm">
      Loading editor…
    </div>
  ),
});

export interface MarkdownEditorProps {
  /** Current markdown content */
  markdown: string;
  /** Called on every change with the updated markdown string */
  onChange: (md: string) => void;
  /** Disable editing */
  readOnly?: boolean;
  /** Extra class names applied to the editor root */
  className?: string;
  /**
   * Async handler for image uploads via the toolbar Insert Image button.
   * Receives the selected File and must resolve to the public URL of the uploaded image.
   * If omitted the editor falls back to a URL-only insertion dialog.
   */
  onImageUpload?: (file: File) => Promise<string>;
}

/**
 * Rich markdown editor powered by @mdxeditor/editor.
 *
 * Client-only (SSR disabled). Safe to import directly in "use client" components.
 *
 * @example
 * ```tsx
 * <MarkdownEditor
 *   markdown={value}
 *   onChange={setValue}
 *   onImageUpload={async (file) => {
 *     const { url } = await uploadFile(file);
 *     return url;
 *   }}
 * />
 * ```
 */
export const MarkdownEditor = forwardRef<MDXEditorMethods, MarkdownEditorProps>((props, ref) => (
  <InitializedEditor editorRef={ref} {...props} />
));

MarkdownEditor.displayName = "MarkdownEditor";
