import { generateSEOMetadata } from "@/utils/seo";
import { SiteConfig } from "@/config";
import { Routes } from "@/data/routes";

import PageWithHeaderFooter from "@/components/layout/PageWithHeaderFooter";
import { PageWrapper } from "@buildbase/ui/components/ui/page-wrapper";
import { PublicPricing } from "@/components/pricing/PublicPricing";
import { PublicPricingProvider } from "@/components/pricing/PublicPricingProvider";

export async function generateMetadata() {
  return generateSEOMetadata({
    title: `Pricing — ${SiteConfig.name}`,
    description: `Simple, transparent pricing for ${SiteConfig.name}. Start free, upgrade when you need more.`,
    url: `${SiteConfig.baseUrl}${Routes.pricing}`,
  });
}

export default function PricingPage() {
  return (
    <PageWithHeaderFooter>
      <PageWrapper>
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-5xl">
              Simple Pricing. No Surprises.
            </h1>
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
              Start free and scale as you grow. Upgrade, downgrade, or cancel anytime.
            </p>
          </div>

          {/* Dynamic plans from Buildbase — requires SaaSOSProvider context */}
          <PublicPricingProvider>
            <PublicPricing />
          </PublicPricingProvider>
        </div>
      </PageWrapper>
    </PageWithHeaderFooter>
  );
}
