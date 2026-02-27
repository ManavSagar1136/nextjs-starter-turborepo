"use client";

import { useMemo, useState } from "react";
import { TbCoin, TbPointer, TbShare } from "react-icons/tb";

import PageWithHeaderFooter from "@/components/layout/PageWithHeaderFooter";
import { Slider } from "@buildbase/ui/slider";

import { SiteConfig } from "@/config";
import { getFormattedNumber } from "@buildbase/utils/format";

// Mock pricing plans data for public app (since we don't have API access)
const mockPricingPlans = [
  {
    title: "Starter",
    billingCycle: "month",
    price: 29,
  },
  {
    title: "Pro",
    billingCycle: "month",
    price: 99,
  },
  {
    title: "Enterprise",
    billingCycle: "month",
    price: 299,
  },
];

// Simplified formatPrice for mock data (prices are already in dollars, not cents)
const formatPrice = (price: number, billingCycle?: string) => {
  if (price === 0) {
    return "0";
  }
  return price.toFixed(2);
};

export function Affiliates() {
  const [affiliateValues, setAffiliateValues] = useState<number[]>(
    mockPricingPlans.map(() => 0),
  );

  const pricingPlans = mockPricingPlans;

  const potentialEarnedMoney = useMemo(() => {
    let totalEarn = 0;
    pricingPlans.forEach((plan, index) => {
      const priceInDollars = parseFloat(formatPrice(plan.price || 0));
      totalEarn += priceInDollars * (affiliateValues[index] || 0) * 0.3;
    });
    return getFormattedNumber(totalEarn);
  }, [affiliateValues, pricingPlans]);

  const onOpenAffiliate = () => window.open(SiteConfig.affiliateProgramLink);

  return (
    <PageWithHeaderFooter>
      <div className="relative w-full">
        <div className="container mx-auto px-5 md:px-20 py-20 md:py-32">
          <div className="text-center">
            <span className="mk-eyebrow mb-3 block">Affiliates</span>
            <h1
              className="font-extrabold leading-tight mb-4 text-3xl md:text-4xl text-slate-900 dark:text-slate-50"
            >
              Be our <span className="mk-gradient-text">affiliate</span>
            </h1>
            <p
              className="mb-8 leading-relaxed text-lg text-slate-600 dark:text-slate-400"
            >
              Partner with us to earn a{" "}
              <strong className="text-slate-900 dark:text-slate-50">recurring 30% commission</strong> every month —{" "}
              <strong className="text-slate-900 dark:text-slate-50">forever</strong>!
            </p>

            <button
              className="inline-flex items-center justify-center rounded-lg px-8 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 bg-indigo-500"
              style={{ boxShadow: "0 0 32px rgba(99, 102, 241, 0.15)" }}
              onClick={onOpenAffiliate}
            >
              Join our affiliate program
            </button>
          </div>

          <div className="mt-16 text-center">
            <h2
              className="font-bold text-2xl md:text-3xl text-slate-900 dark:text-slate-50"
            >
              You can earn{" "}
              <span className="mk-gradient-text">{`$${potentialEarnedMoney}`}</span>{" "}
              every month
            </h2>
            <p className="mt-2 text-slate-400 dark:text-slate-600">
              The calculation is based on monthly price
            </p>
          </div>

          <div className="mt-16 space-y-8 max-w-2xl mx-auto">
            {pricingPlans?.map((plan, index) => {
              if (plan.price === 0) {
                return null;
              }

              return (
                <div
                  className="flex flex-col md:flex-row items-center gap-4"
                  key={plan.title + plan.billingCycle}
                >
                  <p className="w-56 text-slate-600 dark:text-slate-400">
                    {plan.title}/{plan.billingCycle} (
                    {plan.price === 0
                      ? "Free"
                      : `$${formatPrice(plan.price || 0, plan.billingCycle)}/month`}
                    )
                  </p>
                  <Slider
                    value={[affiliateValues[index] || 0]}
                    max={500}
                    min={0}
                    step={1}
                    onValueChange={(val: number[]) => {
                      const newValues = [...affiliateValues];
                      newValues[index] = val[0] || 0;
                      setAffiliateValues(newValues);
                    }}
                  />
                  <p className="text-slate-900 dark:text-slate-50">{affiliateValues[index] || 0} referrals</p>
                </div>
              );
            })}
          </div>
          <div className="mt-16 text-center">
            <h2
              className="font-bold mb-8 text-2xl md:text-3xl text-slate-900 dark:text-slate-50"
            >
              How it works
            </h2>
            <div className="space-y-4 max-w-2xl mx-auto">
              {[
                {
                  icon: <TbPointer size={24} />,
                  text: "Sign up for our affiliate program and get a unique link that can be shared",
                },
                {
                  icon: <TbShare size={24} />,
                  text: "Share your link with your friends, customers, clients...",
                },
                {
                  icon: <TbCoin size={24} />,
                  text: "You'll get 30% recurring commission for every successful referral",
                },
              ].map(({ icon, text }, index) => (
                <div key={index + text} className="flex items-center gap-4">
                  <div
                    className="p-2 rounded-full text-white flex-shrink-0 bg-indigo-500"
                  >
                    {icon}
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 text-center">
            <h2
              className="font-bold mb-4 text-2xl md:text-3xl text-slate-900 dark:text-slate-50"
            >
              Affiliate terms
            </h2>
            <p className="mb-8 text-slate-600 dark:text-slate-400">
              There are a few rules about our affiliate program you should know
              about. No &quot;gotchas&quot; here, just some terms to keep everyone happy.
            </p>
            <ul
              className="list-disc list-inside text-left mx-auto max-w-2xl space-y-4 text-slate-600 dark:text-slate-400"
            >
              <li>
                Self-referrals are not allowed (i.e., signing up through your
                own affiliate link).
              </li>
              <li>
                Abuse, gaming, or attempting to mislead will result in a ban.
              </li>
              <li>
                No search engine ads or paid ads competing with our marketing.
              </li>
              <li>
                No pretending to act on behalf of us (i.e., as an employee).
              </li>
              <li>We reserve the right to change these terms at any time.</li>
            </ul>
          </div>

          <div className="text-center mt-16">
            <h2
              className="font-bold mb-4 text-2xl md:text-3xl text-slate-900 dark:text-slate-50"
            >
              Ready to partner with us?
            </h2>
            <button
              className="inline-flex items-center justify-center rounded-lg px-8 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 bg-indigo-500"
              style={{ boxShadow: "0 0 32px rgba(99, 102, 241, 0.15)" }}
              onClick={onOpenAffiliate}
            >
              Join our affiliate program
            </button>
          </div>
        </div>
        <div
          className="absolute inset-0 blur-3xl opacity-20 pointer-events-none"
          style={{ background: "linear-gradient(to right, #6366F1, #06B6D4)" }}
          aria-hidden="true"
        />
      </div>
    </PageWithHeaderFooter>
  );
}
