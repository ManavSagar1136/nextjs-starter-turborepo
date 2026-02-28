import type { MDXComponents } from "mdx/types";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExternalLinks from "rehype-external-links";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

import { getMDXComponentMap } from "../mdx/components";

interface MarkdownViewProps {
  content: string;
  components?: MDXComponents;
}

/**
 * Server component for rendering raw markdown/MDX content from the database.
 * Uses MDXRemote to compile and render markdown on the server.
 *
 * This is used for rendering raw markdown/MDX content from the database.
 *
 * @example
 * ```tsx
 * <MarkdownView content={post.content} />
 * ```
 */
export default function MarkdownView({
  content,
  components: customComponents,
}: MarkdownViewProps) {
  const components = customComponents || getMDXComponentMap();

  if (!content || !content.trim()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8 text-center">
        <div className="rounded-full bg-slate-100 dark:bg-dark-surface-elevated p-4">
          <p className="text-slate-400 dark:text-slate-600">No content available</p>
        </div>
      </div>
    );
  }

  return (
    <div data-mdx-content="true">
      <MDXRemote
        source={content}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [
              rehypeSlug,
              [
                rehypePrettyCode,
                {
                  theme: "github-light",
                  onVisitLine(node: any) {
                    if (node.children.length === 0) {
                      node.children = [{ type: "text", value: " " }];
                    }
                    if (!node.properties.className)
                      node.properties.className = [];
                    node.properties.className.push("line");
                  },
                  onVisitHighlightedLine(node: any) {
                    node.properties.className.push("line--highlighted");
                  },
                  onVisitHighlightedWord(node: any) {
                    node.properties.className = ["word--highlighted"];
                  },
                },
              ],
              [
                rehypeAutolinkHeadings,
                {
                  properties: {
                    className: ["subheading-anchor"],
                    ariaLabel: "Link to section",
                    type: "heading",
                  },
                },
              ],
              [
                rehypeExternalLinks,
                {
                  target: "_blank",
                  rel: ["noopener", "noreferrer"],
                },
              ],
            ],
          },
        }}
        components={components}
      />
    </div>
  );
}
