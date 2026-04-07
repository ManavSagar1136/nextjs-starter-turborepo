import Link from "next/link";
import { format } from "date-fns";
import { compareDesc } from "date-fns";
import { ArrowRight, Calendar, CheckCircle2, Sparkles } from "lucide-react";
import { type Metadata } from "next";
import { Home } from "lucide-react";

import { Routes } from "@/data/routes";
import { SiteConfig } from "@/config";
import { generateSEOMetadata } from "@/utils/seo";
import { ChangelogPostService } from "@/lib/changelogs/changelog-post.service";
import { DocLayout } from "@/components/content/DocLayout";
import { Badge } from "@buildbase/ui/components/ui/badge";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return generateSEOMetadata({
    title: "Changelogs",
    description: "See what's new and improved in our latest updates",
    url: `${SiteConfig.baseUrl}${Routes.changelogs}`,
  });
}

export default async function ChangelogPage() {
  const result = await ChangelogPostService.listChangelogPosts({
    published: true,
    includeDeleted: false,
    limit: 1000,
  });

  const changelogs = (result.posts || []).sort((a: any, b: any) =>
    compareDesc(
      new Date(a.publishedAt || a.createdAt),
      new Date(b.publishedAt || b.createdAt),
    ),
  );

  const breadcrumbs = [
    { icon: <Home className="h-4 w-4" />, href: Routes.root },
    { title: "Changelogs" },
  ];

  return (
    <DocLayout
      title="Changelog"
      description="Stay up to date with the latest features, improvements, and fixes"
      breadcrumbs={breadcrumbs}
    >
      {/* Timeline */}
      <div className="relative py-4">
        {/* Vertical line */}
        {changelogs.length > 1 && (
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-purple-500 via-blue-400/40 to-transparent hidden sm:block" />
        )}

        <div className="space-y-6">
          {changelogs.map((changelog: any, index: number) => {
            const displayDate =
              changelog.releaseDate ||
              changelog.publishedAt ||
              changelog.createdAt;
            const formattedDate = displayDate
              ? format(new Date(displayDate), "MMM d, yyyy")
              : null;

            return (
              <div key={changelog.id} className="relative sm:pl-12">
                {/* Timeline dot */}
                {changelogs.length > 1 && (
                  <div className="absolute left-4 top-5 -translate-x-1/2 w-3 h-3 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 ring-4 ring-white dark:ring-dark-surface hidden sm:block" />
                )}

                <Link
                  href={changelog.url || `${Routes.changelogs}/${changelog.slug}`}
                  className="group block"
                >
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-surface-secondary p-5 md:p-6 transition-all duration-200 hover:border-purple-400/50 dark:hover:border-purple-500/40 hover:shadow-md">
                    {/* Version + date row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 font-mono text-sm">
                          v{changelog.version.replace(/^v/i, "")}
                        </Badge>
                        {index === 0 && (
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Latest
                          </Badge>
                        )}
                      </div>
                      {formattedDate && (
                        <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                          <Calendar className="w-3.5 h-3.5" />
                          {formattedDate}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h2 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-50 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors flex items-center gap-2">
                      {changelog.title}
                      <ArrowRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all shrink-0" />
                    </h2>

                    {/* Description */}
                    {changelog.description && (
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                        {changelog.description}
                      </p>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {changelogs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-purple-500/10 mb-4">
              <Sparkles className="w-7 h-7 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-1">
              No updates yet
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
              Check back soon for exciting new features and improvements!
            </p>
          </div>
        )}
      </div>
    </DocLayout>
  );
}
