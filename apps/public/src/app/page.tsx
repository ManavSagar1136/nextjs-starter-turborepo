import DUMMY_FAQS from "@/data/faqs";
import { Routes } from "@/data/routes";
import { generateSEOMetadata } from "@/utils/seo";
import { SiteConfig } from "@/config";

import { FAQ } from "@/components/faq/FAQ";
import { Features } from "@/components/features/Features";
import { Hero } from "@/components/hero/Hero";
import { Newsletter } from "@/components/newsletter/Newsletter";
import { HomePricingSection } from "@/components/pricing/HomePricingSection";
import PageWithHeaderFooter from "@/components/layout/PageWithHeaderFooter";
import { SalesNotifications } from "@/components/marketing/SalesNotifications";
import Testimonials from "@/components/testimonial/Testimonials";

import { StatsBar } from "@/components/landing/StatsBar";
import { ArchitectureVisual } from "@/components/landing/ArchitectureVisual";
import { TechStackGrid } from "@/components/landing/TechStackGrid";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { CodePreview } from "@/components/landing/CodePreview";
import { ComparisonTable } from "@/components/landing/ComparisonTable";
import { CTASection } from "@/components/landing/CTASection";

export async function generateMetadata() {
  return generateSEOMetadata({
    title: SiteConfig.meta.title,
    description: SiteConfig.meta.description,
    url: `${SiteConfig.baseUrl}${Routes.root}`,
  });
}

export default function Home() {
  return (
    <PageWithHeaderFooter noWrapper>
      <Hero showCta={true} showBookDemo={true} showUsers={true} />
      <StatsBar />
      <ArchitectureVisual />
      <Features />
      <TechStackGrid />
      <HowItWorks />
      <CodePreview />
      <ComparisonTable />
      <HomePricingSection />
      <Testimonials />
      <FAQ faqs={DUMMY_FAQS} />
      <Newsletter />
      <CTASection />
      <SalesNotifications />
    </PageWithHeaderFooter>
  );
}
