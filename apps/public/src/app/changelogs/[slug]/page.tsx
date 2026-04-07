import { Metadata } from "next";
import { notFound } from "next/navigation";

import { Routes } from "@/data/routes";
import { SiteConfig } from "@/config";
import { generateSEOMetadata } from "@/utils/seo";
import { ChangelogPostService } from "@/lib/changelogs/changelog-post.service";
import { JsonLd } from "@/components/seo/JsonLd";
import ChangelogSingleItem from "@/components/changelog/ChangelogSingleItem";

interface IPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const all = await ChangelogPostService.getAllPublishedForSSG();
    return all.map((changelog) => ({ slug: changelog.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: IPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await ChangelogPostService.getChangelogPostBySlug(slug);
  if (!post || !post.published) return notFound();

  return generateSEOMetadata({
    title: `${post.seoTitle || post.title} - Changelogs`,
    description: post.seoDescription || post.description || undefined,
    url: `${SiteConfig.baseUrl}${post.url || `${Routes.changelogs}/${post.slug}`}`,
    type: "article",
    keywords: post.seoKeywords || [],
    publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
    modifiedTime: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
  });
}

const ChangelogDetailPage = async (props: IPageProps) => {
  const { slug } = await props.params;
  const post = await ChangelogPostService.getChangelogPostBySlug(slug);

  if (!post || !post.published) {
    return notFound();
  }

  const changelogUrl = `${SiteConfig.baseUrl}${post.url || `${Routes.changelogs}/${post.slug}`}`;

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.seoTitle || post.title,
    description: post.seoDescription || post.description,
    datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
    dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
    url: changelogUrl,
    publisher: {
      "@type": "Organization",
      name: SiteConfig.name,
      url: SiteConfig.baseUrl,
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SiteConfig.baseUrl },
      { "@type": "ListItem", position: 2, name: "Changelogs", item: `${SiteConfig.baseUrl}${Routes.changelogs}` },
      { "@type": "ListItem", position: 3, name: post.title, item: changelogUrl },
    ],
  };

  return (
    <>
      <JsonLd data={articleLd} />
      <JsonLd data={breadcrumbLd} />
      <ChangelogSingleItem data={post} />
    </>
  );
};

export default ChangelogDetailPage;
