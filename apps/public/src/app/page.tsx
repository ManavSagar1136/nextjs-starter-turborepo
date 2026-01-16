import DUMMY_FAQS from "@/data/faqs";
import { Routes } from "@/data/routes";
import { generateSEOMetadata } from "@/utils/seo";
import { SiteConfig } from "@/config";

import { ClickToActionBox } from "@/components/marketing/ClickToActionBox";
import { ExplainerVideo } from "@/components/marketing/ExplainerVideo";
import { FAQ } from "@/components/marketing/FAQ";
import { Features } from "@/components/marketing/Features";
import { Hero } from "@/components/marketing/Hero";
import { Newsletter } from "@/components/marketing/Newsletter";
import PageWithHeaderFooter from "@/components/layout/PageWithHeaderFooter";
import { SalesNotifications } from "@/components/marketing/SalesNotifications";
import Testimonials from "@/components/marketing/Testimonials";
import { PageWrapper } from "@/components/ui/PageWrapper";

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
        <Newsletter />
        <ClickToActionBox />
        <SalesNotifications />
      </PageWrapper>
    </PageWithHeaderFooter>
  );
}
