"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { BookOpen, Calendar } from "lucide-react";

import {
  AppBreadcrumb,
  BreadcrumbItemConfig,
} from "@buildbase/ui/components/ui/app-breadcrumb";

import { TOCItem } from "@/lib/toc";
import { cn } from "@buildbase/ui/lib/utils";

import HeroBgWrapper from "../hero-bg-wrapper";
import { Button } from "@buildbase/ui/components/ui/button";
import { TableOfContents, TableOfContentsSheet } from "./TableOfContents";

interface DocLayoutProps {
  children: React.ReactNode;
  toc?: TOCItem[];
  sidebar?: React.ReactNode;
  breadcrumbs?: BreadcrumbItemConfig[];
  className?: string;
  title: string;
  description?: string | null;
  heroBgWrapperClassNames?: string;
  lastUpdatedAt?: string | Date;
}

export function DocLayout({
  children,
  toc,
  breadcrumbs,
  className,
  title,
  description,
  lastUpdatedAt,
}: DocLayoutProps) {
  const [showTOC, setShowTOC] = useState<boolean>(false);

  return (
    <div
      className={cn(
        "min-h-screen max-w-[1440px] w-full px-4 md:px-8 bg-white dark:bg-dark-surface",
        className,
      )}
    >
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
      {/* Main content */}
      <div className="flex gap-6">
        {/* Content area */}
        <div className="flex-1 min-w-0">
          <HeroBgWrapper classNames="py-6 md:py-8 space-y-2">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-center px-4">
              {title}
            </h1>
            {description && (
              <p className="text-sm lg:text-base text-center px-4 max-w-2xl line-clamp-2">
                {description}
              </p>
            )}
            {lastUpdatedAt && (
              <time
                dateTime={
                  typeof lastUpdatedAt === "string"
                    ? lastUpdatedAt
                    : lastUpdatedAt.toISOString()
                }
                className="flex items-center justify-center gap-2 text-sm text-slate-400 dark:text-slate-600"
              >
                <Calendar className="h-4 w-4" />
                <span>
                  Last updated:{" "}
                  {typeof lastUpdatedAt === "string"
                    ? format(parseISO(lastUpdatedAt), "MMM d, yyyy")
                    : format(lastUpdatedAt, "MMM d, yyyy")}
                </span>
              </time>
            )}
          </HeroBgWrapper>
          {/* Breadcrumbs */}
          <div className="mt-3 mb-4">
            <AppBreadcrumb
              items={breadcrumbs}
              className="text-sm text-slate-400 dark:text-slate-600"
            />
          </div>

          {/* Main content */}
          <main className="flex-1">
            {children}
          </main>
        </div>

        {/* Table of contents */}
        {toc && toc.length > 0 && (
          <div className="hidden xl:block max-w-80 flex-shrink-0 flex-1">
            <div className="sticky top-24 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-surface-secondary">
              <TableOfContents
                items={toc}
                className="p-4"
                classNames={{ scrollArea: "h-[87vh]" }}
              />
            </div>
          </div>
        )}
      </div>
      {/* Mobile Table of Contents Sheet */}
      {toc && toc.length > 0 && (
        <TableOfContentsSheet
          items={toc}
          open={showTOC}
          onOpenChange={setShowTOC}
        />
      )}
    </div>
  );
}
