"use client";

import { PublicPricingProvider } from "./PublicPricingProvider";
import { PublicPricing } from "./PublicPricing";

/**
 * HomePricingSection
 *
 * Renders the pricing section on the homepage ("/").
 * Reuses PublicPricingProvider + PublicPricing from the /pricing page.
 *
 * Placement: after Testimonials, before Newsletter/CTA.
 */
export function HomePricingSection() {
  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section header */}
      <div className="mb-12 text-center">
        <h2 className="mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Simple Pricing. No Surprises.
        </h2>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          Start free and scale as you grow. Upgrade, downgrade, or cancel anytime.
        </p>
      </div>

      {/* Plans — dynamic via usePublicPlans, static fallback if unavailable */}
      <PublicPricingProvider>
        <PublicPricing />
      </PublicPricingProvider>
    </section>
  );
}
