import DUMMY_FAQS from "@/data/faqs";
import { Routes } from "@/data/routes";
import { generateSEOMetadata } from "@/utils/seo";
import { SiteConfig } from "@/config";

import { ClickToActionBox } from "@/components/click-to-action-box/ClickToActionBox";
import { ExplainerVideo } from "@/components/explainer-video/ExplainerVideo";
import { FAQ } from "@/components/faq/FAQ";
import { Features } from "@/components/features/Features";
import { Hero } from "@/components/hero/Hero";
import { Newsletter } from "@/components/newsletter/Newsletter";
import { HomePricingSection } from "@/components/pricing/HomePricingSection";
import PageWithHeaderFooter from "@/components/layout/PageWithHeaderFooter";
import { SalesNotifications } from "@/components/marketing/SalesNotifications";
import Testimonials from "@/components/testimonial/Testimonials";
import { PageWrapper } from "@buildbase/ui/components/ui/page-wrapper";

export async function generateMetadata() {
  return generateSEOMetadata({
    title: SiteConfig.meta.title,
    description: SiteConfig.meta.description,
    url: `${SiteConfig.baseUrl}${Routes.root}`,
  });
}

export default function Home() {
  return (
    <PageWithHeaderFooter>
      <PageWrapper paddingBlock="none">
        <Hero showCta={true} showBookDemo={true} showUsers={true} />
        <Features />
        <ExplainerVideo />
        <FAQ faqs={DUMMY_FAQS} />
        <Testimonials />
        <HomePricingSection />
        <Newsletter />
        <ClickToActionBox />
        <SalesNotifications />
      </PageWrapper>
    </PageWithHeaderFooter>
  );
}
