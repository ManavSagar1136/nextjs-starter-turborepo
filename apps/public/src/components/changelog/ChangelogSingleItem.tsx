import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, Calendar } from "lucide-react";
import { Suspense } from "react";

import { Routes } from "@/data/routes";
import { IChangelogPost } from "@/services/changelogs";
import MarkdownView from "@/components/mdx/MarkdownView";
import HeroBgWrapper from "@/components/hero-bg-wrapper";
import { Badge } from "@buildbase/ui/components/ui/badge";
import { Button } from "@buildbase/ui/components/ui/button";

function ChangelogSingleItem({ data }: { data: IChangelogPost }) {
  const { version, title, publishedAt, createdAt, releaseDate, description, content } = data;

  const displayDate = releaseDate || publishedAt || createdAt;
  const formattedDate = displayDate
    ? format(new Date(displayDate), "MMMM d, yyyy")
    : null;

  return (
    <div className="min-h-screen max-w-[1440px] w-full px-4 md:px-8">
      {/* Hero header — matches DocLayout's HeroBgWrapper */}
      <HeroBgWrapper classNames="py-6 md:py-10 space-y-3">
        <div className="flex items-center justify-center">
          <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 font-mono text-sm px-3 py-1">
            v{version.replace(/^v/i, "")}
          </Badge>
        </div>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-center px-4 text-slate-900 dark:text-slate-50">
          {title}
        </h1>
        {description && (
          <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400 text-center px-4 max-w-2xl line-clamp-3">
            {description}
          </p>
        )}
        {formattedDate && (
          <span className="flex items-center justify-center gap-1.5 text-sm text-slate-400 dark:text-slate-500">
            <Calendar className="w-4 h-4" />
            {formattedDate}
          </span>
        )}
      </HeroBgWrapper>

      {/* Back link */}
      <div className="mt-4 mb-6">
        <Link
          href={Routes.changelogs}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All Changelogs
        </Link>
      </div>

      {/* MDX content */}
      <article className="prose max-w-none pb-16">
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
    </div>
  );
}

export default ChangelogSingleItem;
