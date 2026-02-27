import { generateSEOMetadata } from "@/utils/seo";
import { SiteConfig } from "@/config";
import { Routes } from "@/data/routes";

import PageWithHeaderFooter from "@/components/layout/PageWithHeaderFooter";
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
      <section
        className="w-full py-20 md:py-32 px-5 md:px-20 bg-white dark:bg-dark-surface"
      >
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <span className="mk-eyebrow mb-3 block">Pricing</span>
            <h1
              className="mb-4 font-extrabold tracking-tight leading-tight text-3xl md:text-4xl text-slate-900 dark:text-slate-50"
            >
              Simple Pricing. <span className="mk-gradient-text">No Surprises.</span>
            </h1>
            <p
              className="mx-auto max-w-2xl leading-relaxed text-lg text-slate-600 dark:text-slate-400"
            >
              Start free and scale as you grow. Upgrade, downgrade, or cancel anytime.
            </p>
          </div>

          {/* Dynamic plans from Buildbase — requires SaaSOSProvider context */}
          <PublicPricingProvider>
            <PublicPricing />
          </PublicPricingProvider>
        </div>
      </section>
    </PageWithHeaderFooter>
  );
}
