import MarkdownView from "../mdx/MarkdownView";

interface BlogMarkdownContentProps {
  content: string;
  postTitle?: string;
}

/**
 * Server component for rendering blog markdown content.
 * This is separated from BlogContentServer to ensure MDXRemote
 * (which is async) is properly handled as a server component.
 */
export default function BlogMarkdownContent({
  content,
  postTitle,
}: BlogMarkdownContentProps) {
  return (
    <div className="mt-8 md:mt-12 lg:mt-16">
      <div className="max-w-4xl mx-auto">
        <MarkdownView content={content || ""} />
      </div>
    </div>
  );
}
