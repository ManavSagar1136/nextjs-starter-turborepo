// import Image from "next/image";
import Link from "next/link";
import type { MDXComponents } from "mdx/types";

import { CodeBlock } from "../content/CodeBlock";
import MDXImage from "../mdx/MDXImage";
import MDXVideo from "../mdx/MDXVideo";

import { cn } from "@buildbase/ui/lib/utils";

/**
 * Base component map for MDX rendering (non-hook version for server components).
 * This is the underlying implementation used by both the hook and direct access.
 */
function getMDXComponentMapBase(components: MDXComponents = {}): MDXComponents {
  return {
    /**
     * Custom rendering for <h1> elements, assigning a slugified id for heading links.
     */
    h1: ({ className, children, ...props }) => {
      const id =
        typeof children === "string"
          ? children.toLowerCase().replace(/[^a-z0-9]+/g, "-")
          : "heading-1";
      return (
        <h1
          id={id}
          className={cn(
            "mt-2 scroll-m-20 text-4xl font-bold tracking-tight",
            className,
          )}
          {...props}
        >
          {children}
        </h1>
      );
    },
    /**
     * Custom rendering for <h2> elements, assigning a slugified id for heading links.
     */
    h2: ({ className, children, ...props }) => {
      const id =
        typeof children === "string"
          ? children.toLowerCase().replace(/[^a-z0-9]+/g, "-")
          : "heading-2";
      return (
        <h2
          id={id}
          className={cn(
            "mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
            className,
          )}
          {...props}
        >
          {children}
        </h2>
      );
    },
    /**
     * Custom rendering for <h3> elements, assigning a slugified id for heading links.
     */
    h3: ({ className, children, ...props }) => {
      const id =
        typeof children === "string"
          ? children.toLowerCase().replace(/[^a-z0-9]+/g, "-")
          : "heading-3";
      return (
        <h3
          id={id}
          className={cn(
            "mt-8 scroll-m-20 text-2xl font-semibold tracking-tight",
            className,
          )}
          {...props}
        >
          {children}
        </h3>
      );
    },
    /**
     * Custom rendering for <h4> elements, assigning a slugified id for heading links.
     */
    h4: ({ className, children, ...props }) => {
      const id =
        typeof children === "string"
          ? children.toLowerCase().replace(/[^a-z0-9]+/g, "-")
          : "heading-4";
      return (
        <h4
          id={id}
          className={cn(
            "mt-8 scroll-m-20 text-xl font-semibold tracking-tight",
            className,
          )}
          {...props}
        >
          {children}
        </h4>
      );
    },
    /**
     * Custom rendering for <h5> elements, assigning a slugified id for heading links.
     */
    h5: ({ className, children, ...props }) => {
      const id =
        typeof children === "string"
          ? children.toLowerCase().replace(/[^a-z0-9]+/g, "-")
          : "heading-5";
      return (
        <h5
          id={id}
          className={cn(
            "mt-8 scroll-m-20 text-lg font-semibold tracking-tight",
            className,
          )}
          {...props}
        >
          {children}
        </h5>
      );
    },
    /**
     * Custom rendering for <h6> elements, assigning a slugified id for heading links.
     */
    h6: ({ className, children, ...props }) => {
      const id =
        typeof children === "string"
          ? children.toLowerCase().replace(/[^a-z0-9]+/g, "-")
          : "heading-6";
      return (
        <h6
          id={id}
          className={cn(
            "mt-8 scroll-m-20 text-base font-semibold tracking-tight",
            className,
          )}
          {...props}
        >
          {children}
        </h6>
      );
    },
    /**
     * Custom rendering for <a> elements using Next.js Link,
     * with underline and font styling.
     */
    a: ({ className, ...props }) => (
      <Link
        className={cn("font-medium underline underline-offset-4", className)}
        {...props}
      />
    ),
    /**
     * Custom rendering for <p> elements, with margin and leading styling.
     */
    p: ({ className, ...props }) => (
      <p
        className={cn("leading-7 [&:not(:first-child)]:mt-6", className)}
        {...props}
      />
    ),
    /**
     * Custom rendering for <ul> unordered lists with spacing and disc style.
     */
    ul: ({ className, ...props }) => (
      <ul className={cn("my-6 ml-6 list-disc", className)} {...props} />
    ),
    /**
     * Custom rendering for <ol> ordered lists with spacing and decimal style.
     */
    ol: ({ className, ...props }) => (
      <ol className={cn("my-6 ml-6 list-decimal", className)} {...props} />
    ),
    /**
     * Custom rendering for <li> list items with margin.
     */
    li: ({ className, ...props }) => (
      <li className={cn("mt-2", className)} {...props} />
    ),
    /**
     * Custom rendering for <blockquote> elements.
     */
    blockquote: ({ className, ...props }) => (
      <blockquote
        className={cn(
          "mt-6 border-l-2 pl-6 italic [&>*]:text-muted-foreground",
          className,
        )}
        {...props}
      />
    ),
    /**
     * Custom image component for <img> tags, supporting lightbox and enhanced rendering.
     *
     * @see MDXImage
     */
    img: MDXImage,
    /**
     * Custom video component for <video> tags, supporting dialog/thumbnails.
     *
     * @see MDXVideo
     */
    video: MDXVideo,
    /**
     * Alias for custom video component under <CustomVideo>.
     *
     * @see MDXVideo
     */
    CustomVideo: MDXVideo,
    /**
     * Custom rendering for <hr> horizontal rule elements.
     */
    hr: ({ ...props }) => <hr className="my-4 md:my-8" {...props} />,
    /**
     * Custom rendering for <table> elements; wraps table for horizontal scrolling.
     */
    table: ({
      className,
      ...props
    }: React.HTMLAttributes<HTMLTableElement>) => (
      <div className="my-6 w-full overflow-y-auto">
        <table className={cn("w-full", className)} {...props} />
      </div>
    ),
    /**
     * Custom rendering for <tr> table row elements.
     */
    tr: ({
      className,
      ...props
    }: React.HTMLAttributes<HTMLTableRowElement>) => (
      <tr
        className={cn("m-0 border-t p-0 even:bg-muted", className)}
        {...props}
      />
    ),
    /**
     * Custom rendering for <th> table header cells.
     */
    th: ({ className, ...props }) => (
      <th
        className={cn(
          "border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right",
          className,
        )}
        {...props}
      />
    ),
    /**
     * Custom rendering for <td> table cells.
     */
    td: ({ className, ...props }) => (
      <td
        className={cn(
          "border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right",
          className,
        )}
        {...props}
      />
    ),
    /**
     * Custom rendering for <pre> elements. Uses a specialized CodeBlock component
     * for code blocks and fallback styling for non-string children.
     */
    pre: ({ className, children, ...props }) => {
      // Extract language from className if present
      const languageMatch = className?.match(/language-(\w+)/);
      const language = languageMatch ? languageMatch[1] : undefined;

      // If it's a code block, use our custom component
      if (typeof children === "string") {
        return (
          <CodeBlock language={language} className={className}>
            {children}
          </CodeBlock>
        );
      }

      // Fallback to regular pre styling
      return (
        <pre
          className={cn(
            "mb-4 mt-6 overflow-x-auto rounded-lg border !bg-muted dark:!bg-white py-4 px-4 text-foreground dark:text-black",
            className,
          )}
          {...props}
        >
          {children}
        </pre>
      );
    },
    /**
     * Custom rendering for <code> elements.
     * Uses inline code styling unless the code is multiline (then <pre> handles).
     */
    code: ({ className, children, ...props }) => {
      // If it's inline code, use simple styling
      if (typeof children === "string" && !children.includes("\n")) {
        return (
          <code
            className={cn(
              "relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm !bg-muted dark:!bg-white text-foreground dark:text-black",
              className,
            )}
            {...props}
          >
            {children}
          </code>
        );
      }

      // If it's a code block, let the pre component handle it
      return (
        <code
          className={cn(
            "relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm !bg-muted dark:!bg-white text-foreground dark:text-black",
            className,
          )}
          {...props}
        >
          {children}
        </code>
      );
    },
    // Spread in any additional user-provided overrides or custom components.
    ...components,
  };
}

/**
 * Returns a mapping of standard and custom React components to be used
 * for rendering MDX content. Allows customization of each tag's rendering
 * (including adding classNames, ids, and using custom components for specific tags).
 *
 * @param components - Additional components to extend or override the default set.
 * @returns MDXComponents - The complete component mapping for use with MDX rendering.
 *
 * ### Example
 * ```tsx
 * import { useMDXComponentMap } from "../mdx/components";
 *
 * const MDXContent = useMDXComponent(post.body.code);
 * const components = useMDXComponentMap();
 *
 * return (
 *   <MDXContent components={components} />
 * );
 * ```
 */
export function useMDXComponentMap(
  components: MDXComponents = {},
): MDXComponents {
  return getMDXComponentMapBase(components);
}

/**
 * Direct access to MDX component map for server components.
 * Use this instead of useMDXComponentMap in server components.
 *
 * @param components - Additional components to extend or override the default set.
 * @returns MDXComponents - The complete component mapping for use with MDX rendering.
 */
export function getMDXComponentMap(
  components: MDXComponents = {},
): MDXComponents {
  return getMDXComponentMapBase(components);
}
