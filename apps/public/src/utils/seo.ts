import { Metadata } from "next";
import { OpenGraphType } from "next/dist/lib/metadata/types/opengraph-types";

import { SiteConfig } from "@/config";

import { robotsMetaData } from "./shared-metadata";
import { capitalizeFirstLetter } from "./string-utils";

const PATH_SEGMENT_LABELS: Record<string, string> = {
  faqs: "FAQs",
  "contact-us": "Contact Us",
};

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: OpenGraphType;
  excludeTitleSegments?: string[];
  // Article-specific OG fields (used when type === "article")
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  section?: string;
  articleTags?: string[];
}

const generateSEOTitle = (
  url: string,
  title: string,
  siteName: string,
  excludeSegments?: string[],
): string => {
  const urlObj = new URL(url);
  let rawParts = urlObj.pathname.split("/").filter(Boolean);

  const normalizedExcludes = excludeSegments?.map((seg) =>
    seg.replace(/^\//, ""),
  );

  if (normalizedExcludes?.length) {
    rawParts = rawParts.filter((part) => !normalizedExcludes.includes(part));
  }

  const pathParts = rawParts.map(
    (part) =>
      PATH_SEGMENT_LABELS[part] ||
      capitalizeFirstLetter(part.replace(/-/g, " ")),
  ) as string[];

  if (!pathParts.length) return siteName;

  const lastRaw = rawParts[rawParts.length - 1];
  const mainTitle =
    (lastRaw && PATH_SEGMENT_LABELS[lastRaw]) ??
    (title ? capitalizeFirstLetter(title) : pathParts[pathParts.length - 1]) ??
    "";

  if (mainTitle) {
    pathParts.pop();
  }

  if (mainTitle && mainTitle.toLowerCase() === siteName.toLowerCase()) return siteName;

  return [mainTitle || siteName, ...pathParts.reverse(), siteName].join(" | ");
};

export function generateSEOMetadata({
  title = SiteConfig.name,
  description = SiteConfig.meta.description,
  keywords = [],
  image = `${SiteConfig.baseUrl}/og.jpg`,
  url = SiteConfig.baseUrl,
  type = "website",
  excludeTitleSegments = [],
  publishedTime,
  modifiedTime,
  authors,
  section,
  articleTags,
}: SEOProps): Metadata {
  const fullTitle = generateSEOTitle(
    url,
    title,
    SiteConfig.name,
    excludeTitleSegments,
  );
  const allKeywords = [...SiteConfig.meta.keywords, ...keywords];

  return {
    metadataBase: new URL(SiteConfig.baseUrl),
    title: fullTitle,
    description: description,
    keywords: allKeywords,
    alternates: {
      canonical: url,
    },
    applicationName: SiteConfig.name,
    openGraph: {
      title: fullTitle,
      description: description,
      url: url,
      siteName: SiteConfig.name,
      type: type,
      images: [
        {
          url: image,
          alt: `${fullTitle} og image preview`,
          width: 1200,
          height: 630,
        },
      ],
      ...(type === "article" && {
        publishedTime,
        modifiedTime,
        authors,
        section,
        tags: articleTags,
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: description,
      images: [
        {
          url: image,
          alt: `${fullTitle} twitter image preview`,
          width: 1200,
          height: 630,
        },
      ],
    },
    manifest: "/manifest.json",
    robots: robotsMetaData.robots,
  };
}
