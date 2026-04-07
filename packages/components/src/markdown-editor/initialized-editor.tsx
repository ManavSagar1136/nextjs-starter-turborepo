import React, { ForwardedRef, useCallback, useMemo } from "react";
import { MDXEditor, MDXEditorMethods } from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { createPlugins } from "./config";

export interface InitializedEditorProps {
  editorRef: ForwardedRef<MDXEditorMethods> | null;
  markdown: string;
  onChange: (md: string) => void;
  readOnly?: boolean;
  className?: string;
  onImageUpload?: (file: File) => Promise<string>;
}

/**
 * Strips import/const alias statements added by the editor parser.
 * MDX import syntax with path aliases (e.g. @/) causes parser errors, so we remove them.
 */
function removeImportStatements(content: string): string {
  if (!content) return content;
  const lines = content.split("\n");
  const filtered: string[] = [];
  let inImportBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("import ")) {
      inImportBlock = true;
      continue;
    }
    if (inImportBlock && trimmed.startsWith("const ") && trimmed.includes("=")) {
      continue;
    }
    if (inImportBlock && trimmed && !trimmed.startsWith("import") && !trimmed.startsWith("const")) {
      inImportBlock = false;
    }
    if (!inImportBlock || trimmed) {
      filtered.push(line);
    }
  }
  return filtered.join("\n");
}

export default function InitializedMDXEditor({
  editorRef,
  markdown,
  onChange,
  readOnly,
  className,
  onImageUpload,
}: InitializedEditorProps) {
  const safeMarkdown = useMemo(() => {
    try {
      return removeImportStatements((markdown || "").trim());
    } catch {
      return "";
    }
  }, [markdown]);

  const handleChange = useCallback(
    (value: string) => {
      onChange(removeImportStatements(value));
    },
    [onChange]
  );

  const plugins = useMemo(
    () => createPlugins({ content: safeMarkdown, onImageUpload }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onImageUpload]
  );

  return (
    <MDXEditor
      ref={editorRef}
      className={`border-border mdx-editor-container rounded-md border ${className ?? ""}`}
      markdown={safeMarkdown}
      onChange={handleChange}
      readOnly={readOnly}
      plugins={plugins}
    />
  );
}
