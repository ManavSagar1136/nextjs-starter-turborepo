import { Suspense } from "react";
import { Routes } from "@/data/routes";

import { IDocPost } from "@/services/docs";

import { DocLayout } from "../content/DocLayout";
import { DocNavigation } from "../content/DocNavigation";
import MarkdownView from "../mdx/MarkdownView";

import { generateTOCFromText } from "@/lib/toc";

/**
 * DocRenderer component props.
 * @property data - The documentation object to render (from API).
 * @property allDocs - All documents for navigation.
 */
interface DocRendererProps {
  data: IDocPost;
  allDocs: IDocPost[];
}

/**
 * Renders a documentation page using MDX, TOC, and navigation.
 * - Uses MarkdownView to render raw markdown/MDX content from API.
 * - Builds a Table of Contents (TOC) from content.
 * - Sets up breadcrumbs and sidebar navigation for easier doc traversal.
 *
 * @component
 * @param {DocRendererProps} props - Props containing doc data to render.
 * @returns {JSX.Element} The rendered documentation page.
 */
const DocRenderer = ({ data, allDocs }: DocRendererProps) => {
  // Generate TOC from content
  const content = data?.content || "";
  const toc = content ? generateTOCFromText(content) : [];

  return (
    <DocLayout
      toc={toc}
      sidebar={<DocNavigation items={allDocs} />}
      title={data.title}
      description={data.subtitle || data.description}
      lastUpdatedAt={data.updatedAt}
    >
      <article className="prose max-w-none">
        {/* The rendered markdown content for the documentation page */}
        <div className="mdx-content">
          <Suspense
            fallback={
              <div className="animate-pulse space-y-4 py-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-4 rounded bg-slate-200 dark:bg-slate-800"
                    style={{ width: `${85 - i * 5}%` }}
                  />
                ))}
              </div>
            }
          >
            <MarkdownView content={content} />
          </Suspense>
        </div>
      </article>
    </DocLayout>
  );
};

export default DocRenderer;
