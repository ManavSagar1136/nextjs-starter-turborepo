"use client";

import { useMemo, useState } from "react";
import { TbCoin, TbPointer, TbShare } from "react-icons/tb";

import HeaderCard from "@buildbase/components/common/header-card";
import PageWithHeaderFooter from "@/components/layout/PageWithHeaderFooter";
import { Button } from "@buildbase/ui/button";
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
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <HeaderCard
              mainTitle="Be our affiliate"
              subTitle={
                <p className="text-lg mb-8">
                  Partner with us to earn a{" "}
                  <strong>recurring 30% commission</strong> every month —{" "}
                  <strong>forever</strong>!
                </p>
              }
              h1
            />

            <Button
              className="px-8 py-4 font-semibold"
              onClick={onOpenAffiliate}
            >
              Join our affiliate program
            </Button>
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-3xl font-bold">
              You can earn{" "}
              <span className="text-brand-500">{`$${potentialEarnedMoney}`}</span>{" "}
              every month
            </h2>
            <p className="text-brand-900 mt-2">
              The calculation is based on monthly price
            </p>
          </div>

          <div className="mt-16 space-y-8">
            {pricingPlans?.map((plan, index) => {
              if (plan.price === 0) {
                return null;
              }

              return (
                <div
                  className="flex flex-col md:flex-row items-center gap-4"
                  key={plan.title + plan.billingCycle}
                >
                  <p className="w-56 text-brand-700">
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
                  <p>{affiliateValues[index] || 0} referrals</p>
                </div>
              );
            })}
          </div>
          <div className="mt-16 text-center">
            <h2 className="text-3xl font-bold mb-8">How it works</h2>
            <div className="space-y-4">
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
                  <div className="p-2 rounded-full bg-brand-500 text-secondary">
                    {icon}
                  </div>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-3xl font-bold mb-4">Affiliate terms</h2>
            <p className="text-secondary-foreground mb-8">
              There are a few rules about our affiliate program you should know
              about. No "gotchas" here, just some terms to keep everyone happy.
            </p>
            <ul className="list-disc list-inside text-left mx-auto max-w-2xl space-y-4">
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
            <h2 className="text-3xl font-bold mb-4">
              Ready to partner with us?
            </h2>
            <Button
              className="px-8 py-4 font-semibold"
              onClick={onOpenAffiliate}
            >
              Join our affiliate program
            </Button>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-brand-900 to-brand-500 blur-3xl opacity-20 pointer-events-none" />
      </div>
    </PageWithHeaderFooter>
  );
}
