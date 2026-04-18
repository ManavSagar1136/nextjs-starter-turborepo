"use client";

import { useState } from "react";
import { Check, X, Loader2, ArrowRight, Gauge, Minus, LayoutList } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { env } from "@buildbase/env";
import { PricingPage } from "@buildbase/saas-sdk";
import type { IPublicPlanVersion, IPublicPlanItem } from "@buildbase/saas-sdk";
import { cn } from "@buildbase/ui/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@buildbase/ui/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@buildbase/ui/components/ui/drawer";

import { SiteConfig } from "@/config";
import {
  staggerContainer,
  scaleIn,
  getMotionVariant,
  VIEWPORT,
} from "@/lib/animation-variants";

type BillingCycle = "monthly" | "quarterly" | "yearly";

const CYCLE_ORDER: BillingCycle[] = ["monthly", "quarterly", "yearly"];

const CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly:   "Monthly",
  quarterly: "Quarterly",
  yearly:    "Yearly",
};

const CYCLE_SUFFIX: Record<BillingCycle, string> = {
  monthly:   "mo",
  quarterly: "qtr",
  yearly:    "yr",
};

// ─── Helpers ──────────────────────────────────────────────────────────────

function getAvailableCycles(plans: IPublicPlanVersion[]): BillingCycle[] {
  return CYCLE_ORDER.filter((cycle) =>
    plans.some((plan) =>
      (plan.pricingVariants ?? []).some((v) => (v.basePricing?.[cycle] ?? 0) > 0)
    )
  );
}

function computeSavingsPct(plans: IPublicPlanVersion[], cycle: "quarterly" | "yearly"): number | null {
  const n = cycle === "quarterly" ? 3 : 12;
  for (const plan of plans) {
    const v = plan.pricingVariants?.[0];
    if (!v?.basePricing) continue;
    const monthly = v.basePricing.monthly;
    const target  = v.basePricing[cycle];
    if (!monthly || !target) continue;
    const pct = Math.round(((monthly * n - target) / (monthly * n)) * 100);
    if (pct > 0) return pct;
  }
  return null;
}

function resolvePlanPrice(
  plan: IPublicPlanVersion,
  cycle: BillingCycle
): { cents: number; resolvedCycle: BillingCycle } | null {
  const v = plan.pricingVariants?.[0];
  if (!v?.basePricing) return null;
  if ((v.basePricing[cycle] ?? 0) > 0) return { cents: v.basePricing[cycle], resolvedCycle: cycle };
  for (const fb of CYCLE_ORDER) {
    if ((v.basePricing[fb] ?? 0) > 0) return { cents: v.basePricing[fb], resolvedCycle: fb };
  }
  return null;
}

function resolveQuota(
  plan: IPublicPlanVersion,
  slug: string,
  cycle: BillingCycle
): { included: number; unitSize: number; overageCents: number | null } | null {
  const qbi = plan.quotas?.[slug];
  if (!qbi) return null;
  const rc = qbi[cycle]?.included !== undefined ? cycle : "monthly";
  const iv = qbi[rc];
  if (!iv || typeof iv.included !== "number") return null;
  const v = plan.pricingVariants?.[0];
  const oc = v?.quotaOverages?.[slug]?.[rc] ?? v?.quotaOverages?.[slug]?.monthly ?? null;
  return {
    included:     iv.included,
    unitSize:     iv.unitSize ?? 1,
    overageCents: typeof oc === "number" && oc > 0 ? oc : null,
  };
}

const PLAN_TAGLINES: Record<string, string> = {
  starter: "For solo developers", basic: "For solo developers",
  pro:     "For growing teams",   growth: "For growing teams",
  scale:   "No limits",           enterprise: "No limits",
};
function getPlanTagline(name: string) {
  return PLAN_TAGLINES[name.toLowerCase()] ?? "Everything you need";
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  usd: "$",    eur: "€",   gbp: "£",   cad: "C$",
  aud: "A$",   jpy: "¥",   inr: "₹",   chf: "CHF",
  sek: "kr",   nok: "kr",  dkk: "kr",  sgd: "S$",
  hkd: "HK$",  nzd: "NZ$", mxn: "MX$", brl: "R$",
  pln: "zł",   czk: "Kč",  thb: "฿",   try: "₺",
  zar: "R",
};
function getCurrencySymbol(currency?: string) {
  return CURRENCY_SYMBOLS[(currency ?? "").toLowerCase()] ?? "$";
}

type SeatPricing = {
  enabled: boolean;
  includedSeats?: number;
  maxSeats?: number;
  perSeat?: Partial<Record<BillingCycle, number>>;
};

function getSeatPricing(plan: IPublicPlanVersion): SeatPricing | undefined {
  const v = plan.pricingVariants?.[0];
  return v ? (v as typeof v & { seatPricing?: SeatPricing }).seatPricing : undefined;
}

function getDescription(item: IPublicPlanItem): string | undefined {
  return (item as IPublicPlanItem & { description?: string }).description;
}

function sortPlansByPrice(plans: IPublicPlanVersion[], cycle: BillingCycle): IPublicPlanVersion[] {
  // spread into a new array (do NOT duplicate) then sort ascending by price
  const copy = plans.slice();
  return copy.sort((a, b) => (resolvePlanPrice(a, cycle)?.cents ?? 0) - (resolvePlanPrice(b, cycle)?.cents ?? 0));
}

// ─── Root ─────────────────────────────────────────────────────────────────

export function PublicPricing() {
  return (
    <PricingPage slug={env.NEXT_PUBLIC_PLAN_GROUP_SLUG ?? ""}>
      {({ loading, error, items, plans }) => {
        if (loading) {
          return (
            <div className="flex min-h-[280px] items-center justify-center">
              <Loader2 className="size-8 animate-spin text-indigo-500" />
            </div>
          );
        }
        if (error || !plans?.length) {
          return (
            <div className="flex min-h-[280px] items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Pricing is unavailable right now. Please try again shortly.
              </p>
            </div>
          );
        }
        return <PricingContent plans={plans} items={items} />;
      }}
    </PricingPage>
  );
}

// ─── Content ──────────────────────────────────────────────────────────────

function PricingContent({ plans, items }: { plans: IPublicPlanVersion[]; items: IPublicPlanItem[] }) {
  const availableCycles = getAvailableCycles(plans);
  const defaultCycle    = availableCycles[0] ?? "monthly";
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(defaultCycle);
  const activeCycle = availableCycles.includes(billingCycle) ? billingCycle : defaultCycle;

  const hasFeatures = items.some((i) => i.type === "feature");
  const hasLimits   = items.some((i) => i.type === "limit");
  const hasQuotas   = items.some((i) => i.type === "quota");
  const hasSeats    = plans.some((p) => getSeatPricing(p)?.enabled);
  const hasDetails  = hasFeatures || hasLimits || hasQuotas || hasSeats;

  return (
    <div className="flex w-full flex-col items-center gap-8">
      {availableCycles.length > 1 && (
        <BillingToggle
          cycles={availableCycles}
          plans={plans}
          value={activeCycle}
          onChange={setBillingCycle}
        />
      )}

      {/* ── Plan cards ── */}
      <PricingCards plans={plans} items={items} billingCycle={activeCycle} />

      {/* ── Compare features button ── */}
      {hasDetails && (
        <CompareButton
          plans={plans}
          items={items}
          billingCycle={activeCycle}
        />
      )}
    </div>
  );
}

// ─── Billing toggle ───────────────────────────────────────────────────────

function BillingToggle({
  cycles, plans, value, onChange,
}: {
  cycles: BillingCycle[];
  plans: IPublicPlanVersion[];
  value: BillingCycle;
  onChange: (v: BillingCycle) => void;
}) {
  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border border-border bg-muted p-1"
      role="tablist"
      aria-label="Billing period"
    >
      {cycles.map((cycle) => {
        const isActive = cycle === value;
        const savings  = cycle !== "monthly" ? computeSavingsPct(plans, cycle) : null;
        return (
          <button
            key={cycle}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(cycle)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {CYCLE_LABELS[cycle]}
            {savings !== null && (
              <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                Save ~{savings}%
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Plan cards grid ─────────────────────────────────────────────────────

function PricingCards({
  plans,
  items,
  billingCycle,
}: {
  plans: IPublicPlanVersion[];
  items: IPublicPlanItem[];
  billingCycle: BillingCycle;
}) {
  const shouldReduce     = useReducedMotion();
  const containerVariant = getMotionVariant(shouldReduce, staggerContainer);
  const cardVariant      = getMotionVariant(shouldReduce, scaleIn);

  const sortedPlans  = sortPlansByPrice(plans, billingCycle);
  const popularIndex = Math.floor(sortedPlans.length / 2);

  const featureItems = items.filter((i) => i.type === "feature");
  const limitItems   = items.filter((i) => i.type === "limit");
  const quotaItems   = items.filter((i) => i.type === "quota");

  return (
    <div className="w-full overflow-x-auto pt-5">
      <motion.div
        variants={containerVariant}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
        className="flex w-max min-w-full justify-center gap-5 px-1"
      >
        {sortedPlans.map((plan, i) => (
          <motion.div key={plan._id} variants={cardVariant} className="flex w-72 shrink-0">
            <PlanCard
              plan={plan}
              featureItems={featureItems}
              limitItems={limitItems}
              quotaItems={quotaItems}
              billingCycle={billingCycle}
              isPopular={i === popularIndex}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Single plan card ─────────────────────────────────────────────────────

function PlanCard({
  plan, featureItems, limitItems, quotaItems, billingCycle, isPopular,
}: {
  plan: IPublicPlanVersion;
  featureItems: IPublicPlanItem[];
  limitItems: IPublicPlanItem[];
  quotaItems: IPublicPlanItem[];
  billingCycle: BillingCycle;
  isPopular: boolean;
}) {
  const variant    = plan.pricingVariants?.[0];
  const symbol     = getCurrencySymbol(variant?.currency);
  const priceInfo  = resolvePlanPrice(plan, billingCycle);
  const isFallback = priceInfo !== null && priceInfo.resolvedCycle !== billingCycle;
  const sp         = getSeatPricing(plan);
  const seatCents  = sp?.enabled && sp.perSeat
    ? (sp.perSeat[billingCycle] ?? sp.perSeat.monthly ?? 0)
    : 0;

  const hasItems = featureItems.length > 0 || limitItems.length > 0 || quotaItems.length > 0;

  const wrapper = isPopular
    ? "relative w-full rounded-2xl p-px mk-gradient-brand shadow-[0_0_40px_rgba(99,102,241,0.25)]"
    : "relative w-full rounded-2xl border border-border shadow-sm";

  const inner = isPopular
    ? "flex h-full flex-col rounded-[15px] bg-primary p-5 dark:bg-dark-surface-elevated"
    : "flex h-full flex-col rounded-[15px] bg-card p-5";

  const divider = isPopular
    ? "border-t border-primary-foreground/10 dark:border-border"
    : "border-t border-border";

  const headingText = isPopular ? "text-primary-foreground dark:text-foreground" : "text-foreground";
  const mutedText   = isPopular ? "text-primary-foreground/60 dark:text-muted-foreground" : "text-muted-foreground";
  const bodyText    = isPopular ? "text-primary-foreground/90 dark:text-foreground" : "text-foreground";

  return (
    <div className={wrapper}>
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 z-10 -translate-x-1/2">
          <span className="mk-gradient-brand inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-semibold text-white shadow">
            Most Popular
          </span>
        </div>
      )}

      <div className={inner}>
        {/* Name + tagline */}
        <p className={cn("text-base font-bold", headingText)}>{plan.name}</p>
        <p className={cn("mt-0.5 text-xs", mutedText)}>{getPlanTagline(plan.name)}</p>

        {/* Price */}
        <div className="mt-4 flex items-end gap-1">
          {priceInfo ? (
            <>
              <span className={cn("text-4xl font-extrabold tracking-tight", headingText)}>
                {symbol}{(priceInfo.cents / 100).toFixed(0)}
              </span>
              <span className={cn("mb-1.5 text-sm", mutedText)}>
                /{CYCLE_SUFFIX[priceInfo.resolvedCycle]}
              </span>
            </>
          ) : (
            <span className={cn("text-2xl font-bold", headingText)}>Custom</span>
          )}
        </div>

        {isFallback && (
          <p className="mt-0.5 text-[11px] text-amber-400">
            Billed {CYCLE_LABELS[priceInfo!.resolvedCycle].toLowerCase()} only
          </p>
        )}

        {sp?.enabled && seatCents > 0 && (
          <p className={cn("mt-1 text-[11px]", mutedText)}>
            + {symbol}{(seatCents / 100).toFixed(2)}/seat/{CYCLE_SUFFIX[billingCycle]}
            {typeof sp.includedSeats === "number" ? ` (${sp.includedSeats} incl.)` : ""}
          </p>
        )}

        {/* CTA */}
        <a
          href={SiteConfig.userAppUrl}
          className={cn(
            "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isPopular
              ? "mk-gradient-brand text-white hover:opacity-90"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          Get Started
          <ArrowRight className="size-4" />
        </a>

        <p className={cn("mt-1.5 text-center text-[11px]", mutedText)}>
          Cancel anytime · Powered by Stripe
        </p>

        {/* ── Compact feature list ── */}
        {hasItems && (
          <>
            <div className={cn(divider, "mt-4 mb-3")} />
            <ul className="flex flex-col gap-1.5">
              {featureItems.map((item) => {
                const included = plan.features?.[item.slug] === true;
                return (
                  <CardFeatureRow
                    key={item._id}
                    label={item.name}
                    included={included}
                    bodyText={bodyText}
                    mutedText={mutedText}
                  />
                );
              })}
              {limitItems.map((item) => {
                const val      = plan.limits?.[item.slug];
                const hasValue = typeof val === "number";
                const label    = hasValue ? `${val!.toLocaleString()} ${item.name}` : item.name;
                return (
                  <CardFeatureRow
                    key={item._id}
                    label={label}
                    included={hasValue}
                    bodyText={bodyText}
                    mutedText={mutedText}
                  />
                );
              })}
              {quotaItems.map((item) => {
                const quota = resolveQuota(plan, item.slug, billingCycle);
                const label = quota
                  ? `${quota.included.toLocaleString()} ${item.name} included`
                  : item.name;
                return (
                  <CardFeatureRow
                    key={item._id}
                    label={label}
                    included={quota !== null}
                    icon={quota ? "gauge" : undefined}
                    bodyText={bodyText}
                    mutedText={mutedText}
                  />
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Compact feature row inside card ─────────────────────────────────────

function CardFeatureRow({
  label, included, icon, bodyText, mutedText,
}: {
  label: string;
  included: boolean;
  icon?: "gauge";
  bodyText: string;
  mutedText: string;
}) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {icon === "gauge" ? (
        <Gauge className="size-3.5 shrink-0 text-indigo-500 dark:text-indigo-400" strokeWidth={2} />
      ) : included ? (
        <Check className="size-3.5 shrink-0 text-indigo-500 dark:text-indigo-400" strokeWidth={2.5} />
      ) : (
        <X className={cn("size-3.5 shrink-0", mutedText)} strokeWidth={2} />
      )}
      <span className={included ? bodyText : cn("line-through", mutedText)}>{label}</span>
    </li>
  );
}

// ─── Compare button (opens modal on desktop, drawer on mobile) ────────────

function CompareButton({
  plans, items, billingCycle,
}: {
  plans: IPublicPlanVersion[];
  items: IPublicPlanItem[];
  billingCycle: BillingCycle;
}) {
  const trigger = (
    <button
      type="button"
      className="inline-flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <LayoutList className="size-4" />
      Compare all features
    </button>
  );

  const content = <ComparisonTable plans={plans} items={items} billingCycle={billingCycle} />;

  return (
    <>
      {/* Desktop: Dialog */}
      <div className="hidden sm:block">
        <Dialog>
          <DialogTrigger asChild>{trigger}</DialogTrigger>
          {/* inline style forces flex, overriding DialogContent's base `grid` class */}
          <DialogContent
            style={{ display: "flex", flexDirection: "column" }}
            className="max-h-[85vh] max-w-4xl overflow-hidden p-0 gap-0"
          >
            <div className="shrink-0 border-b border-border px-3 py-2">
              <DialogTitle className="text-base font-semibold">Feature Comparison</DialogTitle>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{content}</div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mobile: Drawer */}
      <div className="sm:hidden">
        <Drawer>
          <DrawerTrigger asChild>{trigger}</DrawerTrigger>
          <DrawerContent style={{ display: "flex", flexDirection: "column" }} className="max-h-[90dvh] overflow-hidden">
            <div className="shrink-0 border-b border-border px-4 py-3">
              <DrawerTitle className="text-base font-semibold">Feature Comparison</DrawerTitle>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto pb-4">{content}</div>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
}

// ─── Comparison table ─────────────────────────────────────────────────────
// Uses <table> so <thead> sticky works correctly inside overflow-x-auto.

function ComparisonTable({
  plans, items, billingCycle,
}: {
  plans: IPublicPlanVersion[];
  items: IPublicPlanItem[];
  billingCycle: BillingCycle;
}) {
  const sortedPlans    = sortPlansByPrice(plans, billingCycle);
  const popularIndex   = Math.floor(sortedPlans.length / 2);
  const featureItems   = items.filter((i) => i.type === "feature");
  const limitItems     = items.filter((i) => i.type === "limit");
  const quotaItems     = items.filter((i) => i.type === "quota");
  const hasSeatPricing = sortedPlans.some((p) => getSeatPricing(p)?.enabled);
  const planCount      = sortedPlans.length;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse" style={{ minWidth: 400 }}>

        {/* ── Sticky plan header row ── */}
        <thead className="sticky top-0 z-10">
          <tr className="bg-background">
            <th style={{ minWidth: 180 }} className="relative sticky left-0 z-20 w-[40%] border-b border-border bg-background py-3 text-left font-normal">
              <div className="pointer-events-none absolute inset-y-0 right-0 w-4 translate-x-full bg-gradient-to-r from-black/10 to-transparent dark:from-black/20" />
            </th>
            {sortedPlans.map((plan, i) => {
              const isPopular = i === popularIndex;
              const pi  = resolvePlanPrice(plan, billingCycle);
              const sym = getCurrencySymbol(plan.pricingVariants?.[0]?.currency);
              return (
                <th
                  key={plan._id}
                  style={{ minWidth: 140 }}
                  className={cn(
                    "border-b border-border py-3 pl-4 pr-3 text-left font-normal",
                    isPopular && "bg-indigo-500/5 dark:bg-indigo-500/10",
                    i < sortedPlans.length - 1 && "border-r border-border"
                  )}
                >
                  <p className={cn("text-sm font-bold", isPopular && "text-indigo-500 dark:text-indigo-400")}>
                    {plan.name}
                  </p>
                  {pi && (
                    <p className="text-xs text-muted-foreground">
                      {sym}{(pi.cents / 100).toFixed(0)}/{CYCLE_SUFFIX[pi.resolvedCycle]}
                    </p>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {/* ── Features ── */}
          {featureItems.length > 0 && (
            <>
              <SectionRow label="Features" planCount={planCount} />
              {featureItems.map((item) => (
                <tr key={item._id}>
                  <LabelCell label={item.name} description={getDescription(item)} />
                  {sortedPlans.map((plan, i) => (
                    <BoolCell
                      key={plan._id}
                      included={plan.features?.[item.slug] === true}
                      isPopular={i === popularIndex}
                      isLast={i === sortedPlans.length - 1}
                    />
                  ))}
                </tr>
              ))}
            </>
          )}

          {/* ── Limits ── */}
          {limitItems.length > 0 && (
            <>
              <SectionRow label="Limits" planCount={planCount} />
              {limitItems.map((item) => (
                <tr key={item._id}>
                  <LabelCell label={item.name} description={getDescription(item)} />
                  {sortedPlans.map((plan, i) => {
                    const val = plan.limits?.[item.slug];
                    return (
                      <ValueCell
                        key={plan._id}
                        value={typeof val === "number" ? val.toLocaleString() : null}
                        isPopular={i === popularIndex}
                        isLast={i === sortedPlans.length - 1}
                      />
                    );
                  })}
                </tr>
              ))}
            </>
          )}

          {/* ── Usage ── */}
          {quotaItems.length > 0 && (
            <>
              <SectionRow label="Usage" planCount={planCount} />
              {quotaItems.map((item) => (
                <tr key={item._id}>
                  <LabelCell label={item.name} description={getDescription(item)} />
                  {sortedPlans.map((plan, i) => {
                    const quota = resolveQuota(plan, item.slug, billingCycle);
                    const sym   = getCurrencySymbol(plan.pricingVariants?.[0]?.currency);
                    return (
                      <QuotaCell
                        key={plan._id}
                        quota={quota}
                        symbol={sym}
                        isPopular={i === popularIndex}
                        isLast={i === sortedPlans.length - 1}
                      />
                    );
                  })}
                </tr>
              ))}
            </>
          )}

          {/* ── Seats ── */}
          {hasSeatPricing && (
            <>
              <SectionRow label="Seats" planCount={planCount} />

              <tr>
                <LabelCell label="Included seats" description="Free with base price" />
                {sortedPlans.map((plan, i) => {
                  const sp = getSeatPricing(plan);
                  return (
                    <ValueCell
                      key={plan._id}
                      value={typeof sp?.includedSeats === "number" ? sp.includedSeats.toString() : null}
                      isPopular={i === popularIndex}
                      isLast={i === sortedPlans.length - 1}
                    />
                  );
                })}
              </tr>

              <tr>
                <LabelCell label="Max seats" />
                {sortedPlans.map((plan, i) => {
                  const sp = getSeatPricing(plan);
                  return (
                    <ValueCell
                      key={plan._id}
                      value={typeof sp?.maxSeats === "number" ? sp.maxSeats.toString() : null}
                      isPopular={i === popularIndex}
                      isLast={i === sortedPlans.length - 1}
                    />
                  );
                })}
              </tr>

              <tr>
                <LabelCell label="Per extra seat" />
                {sortedPlans.map((plan, i) => {
                  const sp    = getSeatPricing(plan);
                  const sym   = getCurrencySymbol(plan.pricingVariants?.[0]?.currency);
                  const cents = sp?.enabled && sp.perSeat
                    ? (sp.perSeat[billingCycle] ?? sp.perSeat.monthly ?? 0)
                    : 0;
                  return (
                    <ValueCell
                      key={plan._id}
                      value={cents > 0 ? `${sym}${(cents / 100).toFixed(2)}/${CYCLE_SUFFIX[billingCycle]}` : null}
                      isPopular={i === popularIndex}
                      isLast={i === sortedPlans.length - 1}
                    />
                  );
                })}
              </tr>
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Section header row ───────────────────────────────────────────────────

function SectionRow({ label, planCount }: { label: string; planCount: number }) {
  return (
    <tr>
      <td
        style={{ minWidth: 180 }}
        className="relative sticky left-0 z-10 border-t border-border bg-muted/50 py-2 pl-3 pr-2"
      >
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-4 translate-x-full bg-gradient-to-r from-black/10 to-transparent dark:from-black/20" />
      </td>
      {Array.from({ length: planCount }).map((_, i) => (
        <td key={i} className="border-t border-border bg-muted/50" />
      ))}
    </tr>
  );
}

// ─── Label cell ───────────────────────────────────────────────────────────

function LabelCell({ label, description }: { label: string; description?: string }) {
  return (
    <td style={{ minWidth: 180 }} className="relative sticky left-0 z-10 border-b border-border bg-background py-2.5 pl-3 pr-4 align-middle">
      <span className="text-sm text-foreground">{label}</span>
      {description && (
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      )}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-4 translate-x-full bg-gradient-to-r from-black/10 to-transparent dark:from-black/20" />
    </td>
  );
}

// ─── Bool cell ────────────────────────────────────────────────────────────

function BoolCell({ included, isPopular, isLast }: {
  included: boolean;
  isPopular: boolean;
  isLast: boolean;
}) {
  return (
    <td className={cn(
      "border-b border-border py-2.5 text-center align-middle",
      isPopular && "bg-indigo-500/5 dark:bg-indigo-500/10",
      !isLast && "border-r border-border"
    )}>
      {included
        ? <Check className="mx-auto size-4 text-indigo-500 dark:text-indigo-400" strokeWidth={2.5} />
        : <Minus className="mx-auto size-4 text-muted-foreground/40" strokeWidth={2} />
      }
    </td>
  );
}

// ─── Value cell ───────────────────────────────────────────────────────────

function ValueCell({ value, isPopular, isLast }: {
  value: string | null;
  isPopular: boolean;
  isLast: boolean;
}) {
  return (
    <td className={cn(
      "border-b border-border py-2.5 text-center align-middle",
      isPopular && "bg-indigo-500/5 dark:bg-indigo-500/10",
      !isLast && "border-r border-border"
    )}>
      {value !== null
        ? <span className="text-sm font-medium tabular-nums text-foreground">{value}</span>
        : <Minus className="mx-auto size-4 text-muted-foreground/40" strokeWidth={2} />
      }
    </td>
  );
}

// ─── Quota cell ───────────────────────────────────────────────────────────

function QuotaCell({ quota, symbol, isPopular, isLast }: {
  quota: { included: number; unitSize: number; overageCents: number | null } | null;
  symbol: string;
  isPopular: boolean;
  isLast: boolean;
}) {
  return (
    <td className={cn(
      "border-b border-border px-2 py-2.5 text-center align-middle",
      isPopular && "bg-indigo-500/5 dark:bg-indigo-500/10",
      !isLast && "border-r border-border"
    )}>
      {quota ? (
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1">
            <Gauge className="size-3.5 text-indigo-500 dark:text-indigo-400" strokeWidth={2} />
            <span className="text-sm font-medium tabular-nums text-foreground">
              {quota.included.toLocaleString()}
            </span>
          </div>
          {quota.overageCents !== null && (
            <span className="text-[11px] text-muted-foreground">
              then {symbol}{(quota.overageCents / 100).toFixed(2)}
              {quota.unitSize > 1 ? `/${quota.unitSize.toLocaleString()}` : ""} ea.
            </span>
          )}
        </div>
      ) : (
        <Minus className="mx-auto size-4 text-muted-foreground/40" strokeWidth={2} />
      )}
    </td>
  );
}
