"use client";

import { ReactNode, useEffect, useState } from "react";
import { BookOpen } from "lucide-react";

import { IBlogPost, IBlogTag } from "@/services/blogs";

import { ReadingProgress } from "./ReadingProgress";
import { RelatedPosts } from "./RelatedPosts";
import {
  TableOfContents,
  TableOfContentsSheet,
  TOC_ATTRIBUTES,
} from "../content/TableOfContents";

import { TOCItem } from "@/lib/toc";
import { cn } from "@buildbase/ui/lib/utils";

import { AppBreadcrumb } from "@buildbase/ui/components/ui/app-breadcrumb";
import { Button } from "@buildbase/ui/components/ui/button";

const BlogRenderer = ({
  post,
  similarBlogs,
  allTags,
  children,
}: {
  post: IBlogPost;
  similarBlogs: IBlogPost[];
  allTags: IBlogTag[];
  children: ReactNode;
}) => {
  // const Component = useMDXComponent(post?.body.code);
  const [showTOC, setShowTOC] = useState(false);
  const [toc, setToc] = useState<TOCItem[]>([]);

  // Generate TOC from rendered DOM headings after MDX content is rendered
  // Only include headings from the MDX content area, not from other parts of the page
  useEffect(() => {
    const timer = setTimeout(() => {
      // Find the MDX content container using the data attribute
      const mdxContentArea = document.querySelector(
        '[data-mdx-content="true"]',
      );
      if (!mdxContentArea) return;

      const headings = mdxContentArea.querySelectorAll(
        "h1, h2, h3, h4, h5, h6",
      );

      const newToc: TOCItem[] = Array.from(headings)
        .filter((heading) => !heading.hasAttribute(TOC_ATTRIBUTES.EXCLUDE))
        .map((heading) => {
          const level = parseInt(heading.tagName.charAt(1));
          const text = heading.textContent || "";
          const id =
            heading.id || text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          return { level, text, id };
        });

      if (newToc.length > 0) {
        setToc(newToc);
      }
    }, 500); // Increased delay to ensure MDX is fully rendered and hydrated

    return () => clearTimeout(timer);
  }, [post.content, post.title]);

  return (
    <div className="flex flex-col min-h-screen max-md:overflow-hidden">
      {/* Reading Progress */}
      <ReadingProgress />

      {/* Main Content */}
      <div className="relative flex gap-8 flex-1 max-md:overflow-hidden">
        {/* Table of Contents - Desktop */}

        <div className="hidden lg:block flex-shrink-0 order-10 w-fit">
          <div className="sticky top-24 border rounded-md">
            <TableOfContents
              items={toc}
              className="p-4 w-80"
              classNames={{ scrollArea: "h-[87vh]" }}
            />
          </div>
        </div>

        {/* Table of Contents - Mobile Toggle */}
        <div
          className={cn(
            "lg:hidden fixed top-4 right-16 md:right-18 z-50",
            showTOC && "hidden",
          )}
        >
          <Button
            variant="ghost"
            className="size-10 flex-center"
            onClick={() => setShowTOC(!showTOC)}
            aria-label="Open Table of Contents"
          >
            {/* BookOpen is a better icon for Table of Contents/list of content */}
            <BookOpen className="w-5 h-5" />
          </Button>
        </div>

        {/* Mobile Table of Contents Sheet */}
        <TableOfContentsSheet
          items={toc}
          open={showTOC}
          onOpenChange={setShowTOC}
        />

        {/* Content Area */}
        <div
          className={cn(
            "transition-all duration-300 flex-1 flex flex-col max-md:overflow-hidden",
          )}
        >
          <AppBreadcrumb className="mb-2" />
          {children}
        </div>
      </div>

      {/* Related Posts */}
      <RelatedPosts
        posts={similarBlogs}
        currentPostSlug={post.slug}
        allTags={allTags}
      />
    </div>
  );
};

export default BlogRenderer;
