"use client";

import { useState } from "react";
import { Loader2, X, Check } from "lucide-react";

import { env } from "@buildbase/env";
import { PricingPage } from "@buildbase/saas-sdk";
import type { IPublicPlanItem, IPublicPlanVersion } from "@buildbase/saas-sdk";
import { cn } from "@buildbase/ui/lib/utils";

type BillingCycle = "monthly" | "quarterly" | "yearly";

const CYCLE_LABEL: Record<BillingCycle, string> = {
  monthly: "month",
  quarterly: "quarter",
  yearly: "year",
};

/**
 * PublicPricing
 *
 * Renders a comparison table of plans fetched from the Buildbase backend.
 * Groups rows by item type (Features, Limits, Quotas) with colored section headers.
 */
export function PublicPricing() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  return (
    <PricingPage slug={env.NEXT_PUBLIC_PLAN_GROUP_SLUG ?? ""}>
      {({ loading, error, items, plans }) => {
        if (loading) {
          return (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="text-slate-400 dark:text-slate-600 size-8 animate-spin" />
            </div>
          );
        }

        if (error || !plans?.length) {
          return (
            <div className="flex min-h-[300px] items-center justify-center">
              <p className="text-slate-400 dark:text-slate-600 text-sm">
                Pricing is not available right now. Please try again in a few minutes.
              </p>
            </div>
          );
        }

        return (
          <div>
            {/* Billing toggle */}
            <div className="flex justify-center mb-4">
              <BillingToggle value={billingCycle} onChange={setBillingCycle} />
            </div>

            {/* Comparison table */}
            <ComparisonTable
              plans={plans}
              items={items}
              billingCycle={billingCycle}
            />
          </div>
        );
      }}
    </PricingPage>
  );
}

// ─── Billing Toggle ──────────────────────────────────────────────────────────

function BillingToggle({
  value,
  onChange,
}: {
  value: BillingCycle;
  onChange: (v: BillingCycle) => void;
}) {
  const options: { value: BillingCycle; label: string }[] = [
    { value: "monthly", label: "Monthly" },
    { value: "yearly", label: "Yearly" },
    { value: "quarterly", label: "Quarterly" },
  ];

  return (
    <div
      className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-surface"
      role="tablist"
      aria-label="Billing period"
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
              isActive
                ? "bg-slate-900 dark:bg-slate-50 text-white dark:text-dark-surface"
                : "text-slate-400 dark:text-slate-600 hover:text-slate-900 dark:hover:text-slate-50"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Comparison Table ────────────────────────────────────────────────────────

function ComparisonTable({
  plans,
  items,
  billingCycle,
}: {
  plans: IPublicPlanVersion[];
  items: IPublicPlanItem[];
  billingCycle: BillingCycle;
}) {
  // Group items by type
  const featureItems = items.filter((i) => i.type === "feature");
  const limitItems = items.filter((i) => i.type === "limit");
  const quotaItems = items.filter((i) => i.type === "quota");

  const colCount = plans.length + 1; // +1 for the "Item" label column

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="w-full border-collapse text-sm">
        {/* Plan name header */}
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800">
            <th className="text-left px-4 py-3 font-medium text-slate-400 dark:text-slate-600 bg-slate-100/30 dark:bg-dark-surface-elevated/30 w-[200px] min-w-[180px]">
            </th>
            {plans.map((plan) => (
              <th
                key={plan._id}
                className="text-center px-4 py-3 font-semibold bg-slate-100/30 dark:bg-dark-surface-elevated/30"
              >
                <div>{plan.name}</div>
              </th>
            ))}
          </tr>

          {/* Price row */}
          <tr className="border-b border-slate-200 dark:border-slate-800">
            <td className="px-4 py-3" />
            {plans.map((plan) => (
              <td key={plan._id} className="text-center px-4 py-3 font-semibold">
                <PriceCell plan={plan} billingCycle={billingCycle} />
              </td>
            ))}
          </tr>
        </thead>

        <tbody>
          {/* Features section */}
          {featureItems.length > 0 && (
            <>
              <SectionHeader
                icon="features"
                label="Features"
                count={featureItems.length}
                colCount={colCount}
                color="blue"
              />
              {featureItems.map((item) => (
                <tr key={item._id} className="border-b border-slate-200 dark:border-slate-800">
                  <ItemLabel item={item} />
                  {plans.map((plan) => (
                    <td key={plan._id} className="px-4 py-3 text-center">
                      <FeatureCell value={plan.features?.[item.slug]} />
                    </td>
                  ))}
                </tr>
              ))}
            </>
          )}

          {/* Limits section */}
          {limitItems.length > 0 && (
            <>
              <SectionHeader
                icon="limits"
                label="Limits"
                count={limitItems.length}
                colCount={colCount}
                color="amber"
              />
              {limitItems.map((item) => (
                <tr key={item._id} className="border-b border-slate-200 dark:border-slate-800">
                  <ItemLabel item={item} />
                  {plans.map((plan) => (
                    <td key={plan._id} className="px-4 py-3">
                      <LimitCell value={plan.limits?.[item.slug]} />
                    </td>
                  ))}
                </tr>
              ))}
            </>
          )}

          {/* Quotas section */}
          {quotaItems.length > 0 && (
            <>
              <SectionHeader
                icon="quotas"
                label="Quotas"
                count={quotaItems.length}
                colCount={colCount}
                color="purple"
              />
              {quotaItems.map((item) => (
                <tr key={item._id} className="border-b border-slate-200 dark:border-slate-800 last:border-b-0">
                  <ItemLabel item={item} />
                  {plans.map((plan) => (
                    <td key={plan._id} className="px-4 py-3">
                      <QuotaCell
                        quota={plan.quotas?.[item.slug]}
                        billingCycle={billingCycle}
                        plan={plan}
                        itemSlug={item.slug}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────

const SECTION_ICONS: Record<string, string> = {
  features: "⊞",
  limits: "⟳",
  quotas: "⏱",
};

const SECTION_COLORS: Record<string, string> = {
  blue: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300",
  amber: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300",
  purple: "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/30 dark:border-purple-800 dark:text-purple-300",
};

function SectionHeader({
  icon,
  label,
  count,
  colCount,
  color,
}: {
  icon: string;
  label: string;
  count: number;
  colCount: number;
  color: string;
}) {
  return (
    <tr>
      <td
        colSpan={colCount}
        className={cn(
          "px-4 py-2 text-sm font-semibold border-b border-t",
          SECTION_COLORS[color]
        )}
      >
        <span className="inline-flex items-center gap-2">
          <span>{SECTION_ICONS[icon]}</span>
          <span>
            {label}{" "}
            <span className="font-normal text-xs">
              {count} {count === 1 ? "item" : "items"}
            </span>
          </span>
        </span>
      </td>
    </tr>
  );
}

// ─── Item Label Cell ─────────────────────────────────────────────────────────

function ItemLabel({ item }: { item: IPublicPlanItem }) {
  return (
    <td className="px-4 py-3 align-top border-r border-slate-200 dark:border-slate-800 w-[200px] min-w-[180px]">
      <div className="font-medium">{item.name}</div>
      {item.description && (
        <div className="text-xs text-slate-400 dark:text-slate-600">{item.description}</div>
      )}
    </td>
  );
}

// ─── Price Cell ──────────────────────────────────────────────────────────────

function PriceCell({
  plan,
  billingCycle,
}: {
  plan: IPublicPlanVersion;
  billingCycle: BillingCycle;
}) {
  // Try to get price from pricingVariants
  if (plan.pricingVariants && plan.pricingVariants.length > 0) {
    const variant = plan.pricingVariants[0]!;
    const cents = variant.basePricing?.[billingCycle];
    if (typeof cents === "number") {
      const symbol = getCurrencySymbol(variant.currency);
      const amount = (cents / 100).toFixed(2);
      return (
        <span>
          {symbol}{amount}/{CYCLE_LABEL[billingCycle]}
        </span>
      );
    }
  }

  return <span className="text-slate-400 dark:text-slate-600">—</span>;
}

// ─── Feature Cell ────────────────────────────────────────────────────────────

function FeatureCell({ value }: { value?: boolean }) {
  if (value === true) {
    return <Check className="inline-block size-5 text-green-600" />;
  }
  return <X className="inline-block size-5 text-slate-400 dark:text-slate-600" />;
}

// ─── Limit Cell ──────────────────────────────────────────────────────────────

function LimitCell({ value }: { value?: number }) {
  if (typeof value !== "number") {
    return <span className="text-slate-400 dark:text-slate-600">—</span>;
  }
  return <span>{value.toLocaleString()}</span>;
}

// ─── Quota Cell ──────────────────────────────────────────────────────────────

function QuotaCell({
  quota,
  billingCycle,
  plan,
  itemSlug,
}: {
  quota?: Record<string, any>;
  billingCycle: BillingCycle;
  plan: IPublicPlanVersion;
  itemSlug: string;
}) {
  if (!quota) {
    return <span className="text-slate-400 dark:text-slate-600">—</span>;
  }

  const intervalData = quota[billingCycle] ?? quota.monthly;
  if (!intervalData || typeof intervalData.included !== "number") {
    return <span className="text-slate-400 dark:text-slate-600">—</span>;
  }

  const included = intervalData.included.toLocaleString();
  const overage = intervalData.overage;
  const unitSize = intervalData.unitSize;

  // Get currency symbol from pricingVariants or from overage info
  let currencySymbol = "₹";
  if (plan.pricingVariants && plan.pricingVariants.length > 0) {
    currencySymbol = getCurrencySymbol(plan.pricingVariants[0]!.currency);
  }

  if (typeof overage === "number" && overage > 0) {
    const overageDisplay = (overage / 100).toFixed(2);
    const unitLabel = unitSize && unitSize > 1
      ? `/${unitSize.toLocaleString()} ${itemSlug}`
      : `/${itemSlug}`;
    return (
      <span>
        Included: {included}, after that {currencySymbol}{overageDisplay}{unitLabel}
      </span>
    );
  }

  return <span>Included: {included}</span>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCurrencySymbol(currency?: string): string {
  const map: Record<string, string> = {
    usd: "$",
    eur: "€",
    gbp: "£",
    inr: "₹",
    sgd: "S$",
    aud: "A$",
    cad: "C$",
    jpy: "¥",
  };
  return map[(currency ?? "").toLowerCase()] ?? currency?.toUpperCase() ?? "$";
}
