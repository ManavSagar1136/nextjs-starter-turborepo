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
        className="w-full py-[var(--mk-section-y)] px-[var(--mk-section-x)]"
        style={{ background: "var(--mk-bg-primary)" }}
      >
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <span className="mk-eyebrow mb-3 block">Pricing</span>
            <h1
              className="mb-4 font-extrabold tracking-tight leading-tight"
              style={{ fontSize: "var(--mk-text-3xl)", color: "var(--mk-text-primary)" }}
            >
              Simple Pricing. <span className="mk-gradient-text">No Surprises.</span>
            </h1>
            <p
              className="mx-auto max-w-2xl leading-relaxed"
              style={{ fontSize: "var(--mk-text-lg)", color: "var(--mk-text-secondary)" }}
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
