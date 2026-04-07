import { getServerSideSitemap } from "next-sitemap";
import type { ISitemapField } from "next-sitemap";
import { SiteConfig } from "@/config";
import { Routes } from "@/data/routes";

export const dynamic = "force-dynamic";

export async function GET() {
  const siteUrl = SiteConfig.baseUrl;

  const fields: ISitemapField[] = [
    { loc: `${siteUrl}${Routes.root}`, changefreq: "daily", priority: 1.0 },
    { loc: `${siteUrl}${Routes.blogs}`, changefreq: "daily", priority: 0.9 },
    { loc: `${siteUrl}${Routes.blogGroups}`, changefreq: "weekly", priority: 0.7 },
    { loc: `${siteUrl}${Routes.blogTags}`, changefreq: "weekly", priority: 0.7 },
    { loc: `${siteUrl}${Routes.docs}`, changefreq: "weekly", priority: 0.9 },
    { loc: `${siteUrl}${Routes.pricing}`, changefreq: "monthly", priority: 0.8 },
    { loc: `${siteUrl}${Routes.faqs}`, changefreq: "monthly", priority: 0.6 },
    { loc: `${siteUrl}${Routes.testimonials}`, changefreq: "monthly", priority: 0.6 },
    { loc: `${siteUrl}${Routes.contactus}`, changefreq: "yearly", priority: 0.5 },
    { loc: `${siteUrl}${Routes.affiliates}`, changefreq: "monthly", priority: 0.5 },
  ];

  return getServerSideSitemap(fields);
}
