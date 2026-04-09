"use client";

import React, { useState } from "react";
import {
  WhenSubscription,
  WhenNoSubscription,
  WhenSubscriptionToPlans,
  WhenTrialing,
  WhenNotTrialing,
  WhenTrialEnding,
  WhenWorkspaceFeatureEnabled,
  WhenWorkspaceFeatureDisabled,
  WhenUserFeatureEnabled,
  WhenRoles,
  WhenWorkspaceRoles,
  useSubscriptionContext,
  useSubscription,
  useSubscriptionManagement,
  useSaaSWorkspaces,
  useSaaSAuth,
  useUserFeatures,
  useFeatureGate,
  FEATURE_STATES,
  useTrialStatus,
  useServerRecordUsage,
  useServerQuotaStatus,
  useServerAllQuotas,
} from "@buildbase/saas-sdk";
import { FeatureGate, FeatureButton } from "@/components/feature-gate";
import { SubscriptionStatusBanner } from "@/components/subscription/SubscriptionStatusBanner";

// ─── Plan slugs (from BuildBase plan config) ─────────────────────────────────
//
//  FEATURE  (boolean flag)  → useFeatureGate(slug)
//    analytics              — analytics dashboard on/off
//
//  LIMIT    (hard numeric cap, no usage tracking)
//    max-test  = 24         — max number of tests allowed
//    max-users = 10         — max workspace members
//
//  QUOTA    (included amount + overage pricing, usage-tracked)
//    videos                 — 2/month, 24/year, 6/quarterly; overage $2/unit per 100
//
//  Not in plan (for upgrade-flow demos)
//    enterprise-sso

const FEATURE_ANALYTICS = "analytics"; // feature flag
const LIMIT_MAX_TEST = "max-test"; // hard limit
const LIMIT_MAX_USERS = "max-users"; // hard limit
const QUOTA_VIDEOS = "videos"; // usage quota with overage
const NOT_IN_PLAN = "enterprise-sso";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatusBadge({
  value,
  trueLabel = "Yes",
  falseLabel = "No",
}: {
  value: boolean;
  trueLabel?: string;
  falseLabel?: string;
}) {
  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-semibold ${
        value
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
      }`}
    >
      {value ? trueLabel : falseLabel}
    </span>
  );
}

function GateBadge({ state }: { state: string }) {
  const colors: Record<string, string> = {
    [FEATURE_STATES.OK]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    [FEATURE_STATES.EXHAUSTED]: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    [FEATURE_STATES.NOT_INCLUDED]: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    [FEATURE_STATES.NOT_PERMITTED]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    [FEATURE_STATES.LOADING]: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
  };
  return (
    <span
      className={`rounded px-2 py-0.5 font-mono text-xs font-semibold ${colors[state] ?? "bg-gray-100 text-gray-500"}`}
    >
      {state}
    </span>
  );
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
      {subtitle && <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function SubSection({ title, code, children }: { title: string; code?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 p-4 dark:border-gray-600">
      <h3 className="mb-1 text-xs font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
      {code && <p className="mb-2 font-mono text-xs text-gray-400 dark:text-gray-500">{code}</p>}
      {children}
    </div>
  );
}

function ResultBox({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`rounded border-l-4 p-3 text-sm ${
        ok
          ? "border-green-500 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200"
          : "border-red-400 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200"
      }`}
    >
      {children}
    </div>
  );
}

function UpgradeFallback({ slug }: { slug: string }) {
  return (
    <div className="rounded border-l-4 border-orange-400 bg-orange-50 p-3 text-sm dark:bg-orange-900/20">
      <p className="font-semibold text-orange-800 dark:text-orange-200">
        🔒 <code className="rounded bg-orange-100 px-1 dark:bg-orange-900">{slug}</code> not in your plan — upgrade to
        unlock
      </p>
    </div>
  );
}

function LimitFallback({ slug, reason }: { slug: string; reason: string }) {
  return (
    <div className="rounded border-l-4 border-red-400 bg-red-50 p-3 text-sm dark:bg-red-900/20">
      <p className="font-semibold text-red-800 dark:text-red-200">
        🚫 <code className="rounded bg-red-100 px-1 dark:bg-red-900">{slug}</code> limit reached — {reason}
      </p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span>{children}</span>
    </div>
  );
}

function TypePill({ type }: { type: "feature" | "limit" | "quota" | "none" }) {
  const styles: Record<string, string> = {
    feature: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    limit: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
    quota: "bg-teal-100   text-teal-700   dark:bg-teal-900   dark:text-teal-300",
    none: "bg-gray-100   text-gray-500",
  };
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${styles[type]}`}>{type}</span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TestSubscriptionHocsPage() {
  const { currentWorkspace } = useSaaSWorkspaces();
  const { response, loading } = useSubscriptionContext();
  const { user } = useSaaSAuth();
  const { features: userFeatures } = useUserFeatures();

  const workspaceId = currentWorkspace?._id || null;

  const { subscription, loading: subLoading, error: subError, refetch: refetchSub } = useSubscription(workspaceId);
  const {
    subscription: mgmtSub,
    planGroup,
    loading: mgmtLoading,
    refetch: refetchMgmt,
  } = useSubscriptionManagement(workspaceId);
  const { isTrialing, isTrialEnding, daysRemaining } = useTrialStatus();

  // ── Plan data ──────────────────────────────────────────────────────────────
  const subStatus = response?.subscription?.subscriptionStatus || "none";
  const planSlug = response?.plan?.slug || "none";
  const planVersion = response?.planVersion || subscription?.planVersion;
  const planFeatures = planVersion?.features || {};
  const planLimits = planVersion?.limits || {};
  const planQuotas = planVersion?.quotas || {};

  // ── Workspace feature flags ────────────────────────────────────────────────
  const wsFeatures = (currentWorkspace as any)?.features || {};
  const wsFeatureKeys = Object.keys(wsFeatures);
  const disabledWsFeatures = wsFeatureKeys.filter(k => wsFeatures[k] === false);

  // ── Roles ──────────────────────────────────────────────────────────────────
  const userRole = user?.role || "none";
  const wsUsers = (currentWorkspace as any)?.users || [];
  const wsRole =
    (Array.isArray(wsUsers)
      ? wsUsers.find((u: any) => u._id === user?.id || u.userId === user?.id)?.role
      : undefined) || "none";

  // ── Live gate states ───────────────────────────────────────────────────────
  // Feature (boolean)
  const { state: stateAnalytics } = useFeatureGate(FEATURE_ANALYTICS);

  // Limits (hard caps — no quotaSlug needed, SDK checks the limit value from plan)
  const { state: stateMaxTest } = useFeatureGate(LIMIT_MAX_TEST);
  const { state: stateMaxUsers } = useFeatureGate(LIMIT_MAX_USERS);

  // Quota (usage-tracked with overage — pass quotaSlug so SDK checks consumed vs included)
  const { state: stateVideos } = useFeatureGate(QUOTA_VIDEOS, { quotaSlug: QUOTA_VIDEOS });

  // Not in plan
  const { state: stateNotInPlan } = useFeatureGate(NOT_IN_PLAN);

  // ── Usage tracking (quotas only — limits don't use usage API) ─────────────
  const [recordQty, setRecordQty] = useState(1);
  const [statusSlug, setStatusSlug] = useState(QUOTA_VIDEOS);

  const { record, isLoading: recLoading, data: recData, error: recError, reset: resetRec } = useServerRecordUsage();
  const {
    data: quotaStatus,
    isLoading: statusLoading,
    error: statusError,
    refetch: refetchStatus,
  } = useServerQuotaStatus({ workspaceId: workspaceId ?? "", quotaSlug: statusSlug });
  const {
    quotas: allQuotas,
    isLoading: allLoading,
    error: allError,
    refetch: refetchAll,
  } = useServerAllQuotas({ workspaceId: workspaceId ?? "" });

  return (
    <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscription & Feature Test Panel</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Live test of all gates using your real plan configuration.
          </p>
          {/* Plan slug legend */}
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {[
              { slug: "analytics", type: "feature" as const, note: "boolean flag" },
              { slug: "max-test", type: "limit" as const, note: "hard cap = 24" },
              { slug: "max-users", type: "limit" as const, note: "hard cap = 10" },
              { slug: "videos", type: "quota" as const, note: "2/mo, overage $2/100" },
              { slug: "enterprise-sso", type: "none" as const, note: "not in plan" },
            ].map(({ slug, type, note }) => (
              <div
                key={slug}
                className="flex items-center gap-1.5 rounded border border-gray-200 bg-white px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
              >
                <code className="text-gray-700 dark:text-gray-300">{slug}</code>
                <TypePill type={type} />
                <span className="text-gray-400">{note}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── SECTION 1: Subscription Status ─────────────────────────────── */}
        <SectionCard
          title="1. Subscription Status"
          subtitle="Live data from useSubscriptionContext, useSubscription, and useSubscriptionManagement."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-400">
                useSubscriptionContext
              </p>
              <Row label="Loading">
                <StatusBadge value={!loading} trueLabel="Ready" falseLabel="Loading…" />
              </Row>
              <Row label="Status">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-semibold ${subStatus === "active" ? "bg-green-100 text-green-800" : subStatus === "trialing" ? "bg-blue-100 text-blue-800" : subStatus === "canceled" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-600"}`}
                >
                  {subStatus.toUpperCase()}
                </span>
              </Row>
              <Row label="Plan slug">
                <span className="font-mono text-xs">{planSlug}</span>
              </Row>
              <Row label="Plan name">
                <span className="text-xs">{response?.plan?.name || "—"}</span>
              </Row>
            </div>

            <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-800 dark:bg-cyan-900/20">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-cyan-700 dark:text-cyan-400">
                useSubscription(workspaceId)
              </p>
              <Row label="Loading">
                <StatusBadge value={!subLoading} trueLabel="Ready" falseLabel="Loading…" />
              </Row>
              {subError && <p className="mt-1 text-xs text-red-600">{subError}</p>}
              <Row label="Status">
                <span className="font-mono text-xs">{subscription?.subscription?.subscriptionStatus || "—"}</span>
              </Row>
              <Row label="Plan">
                <span className="text-xs">{subscription?.plan?.name || "—"}</span>
              </Row>
              <button
                onClick={() => refetchSub()}
                className="mt-3 w-full rounded bg-cyan-600 py-1 text-xs text-white hover:bg-cyan-700"
              >
                Refetch
              </button>
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                useSubscriptionManagement
              </p>
              <Row label="Loading">
                <StatusBadge value={!mgmtLoading} trueLabel="Ready" falseLabel="Loading…" />
              </Row>
              <Row label="Status">
                <span className="font-mono text-xs">{mgmtSub?.subscription?.subscriptionStatus || "—"}</span>
              </Row>
              <Row label="Plan group">
                <span className="text-xs">{planGroup?.group?.name || "—"}</span>
              </Row>
              <button
                onClick={() => refetchMgmt()}
                className="mt-3 w-full rounded bg-emerald-600 py-1 text-xs text-white hover:bg-emerald-700"
              >
                Refetch
              </button>
            </div>
          </div>
        </SectionCard>

        {/* ── SECTION 2: Plan Configuration ──────────────────────────────── */}
        <SectionCard
          title="2. Plan Configuration — Features, Limits & Quotas"
          subtitle="Raw values from planVersion. Your plan has: 1 feature flag, 2 hard limits, 1 quota."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {/* Features */}
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20">
              <div className="mb-2 flex items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-wide text-purple-700 dark:text-purple-400">
                  Features
                </p>
                <TypePill type="feature" />
              </div>
              <p className="mb-2 text-xs text-purple-600 dark:text-purple-400">
                Boolean flags. On = feature available to workspace.
              </p>
              {Object.keys(planFeatures).length > 0 ? (
                Object.entries(planFeatures).map(([slug, val]) => (
                  <Row key={slug} label={slug}>
                    <StatusBadge value={val === true} trueLabel="✓ On" falseLabel="✗ Off" />
                  </Row>
                ))
              ) : (
                <p className="text-xs text-gray-400">No features in plan</p>
              )}
            </div>

            {/* Limits */}
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-900/20">
              <div className="mb-2 flex items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-400">Limits</p>
                <TypePill type="limit" />
              </div>
              <p className="mb-2 text-xs text-indigo-600 dark:text-indigo-400">
                Hard caps. Cannot exceed. No usage tracking needed — SDK checks count vs limit.
              </p>
              {Object.keys(planLimits).length > 0 ? (
                Object.entries(planLimits).map(([slug, val]) => (
                  <Row key={slug} label={slug}>
                    <span className="font-mono text-sm font-bold text-indigo-700 dark:text-indigo-300">
                      {typeof val === "number" ? val.toLocaleString() : String(val)}
                    </span>
                  </Row>
                ))
              ) : (
                <p className="text-xs text-gray-400">No limits in plan</p>
              )}
              <div className="mt-2 rounded bg-indigo-100 p-2 text-xs text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                max-test = 24 · max-users = 10
              </div>
            </div>

            {/* Quotas */}
            <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 dark:border-teal-800 dark:bg-teal-900/20">
              <div className="mb-2 flex items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-wide text-teal-700 dark:text-teal-400">Quotas</p>
                <TypePill type="quota" />
              </div>
              <p className="mb-2 text-xs text-teal-600 dark:text-teal-400">
                Usage-tracked with included amount + overage pricing. Record consumption via API.
              </p>
              {Object.keys(planQuotas).length > 0 ? (
                Object.entries(planQuotas).map(([slug, val]) => (
                  <Row key={slug} label={slug}>
                    <span className="font-mono text-xs text-teal-700 dark:text-teal-300">
                      {typeof val === "object" ? JSON.stringify(val) : String(val)}
                    </span>
                  </Row>
                ))
              ) : (
                <p className="text-xs text-gray-400">No quotas in plan</p>
              )}
              <div className="mt-2 rounded bg-teal-100 p-2 text-xs text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                videos: 2/mo included · $2 overage per 100
              </div>
            </div>
          </div>

          {/* Workspace feature flags */}
          {wsFeatureKeys.length > 0 && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                Workspace Feature Flags (currentWorkspace.features)
              </p>
              <div className="grid gap-1 sm:grid-cols-2 md:grid-cols-3">
                {wsFeatureKeys.map(k => (
                  <Row key={k} label={k}>
                    <StatusBadge value={wsFeatures[k] === true} trueLabel="Enabled" falseLabel="Disabled" />
                  </Row>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        {/* ── SECTION 3: SDK HOC Gates ────────────────────────────────────── */}
        <SectionCard
          title="3. SDK HOC Gates — live results"
          subtitle="Render logic components from @buildbase/saas-sdk using your real slugs."
        >
          {/* Subscription HOCs */}
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            3.1 Subscription
          </h3>
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <SubSection title="WhenSubscription" code="<WhenSubscription>">
              <WhenSubscription fallbackComponent={<ResultBox ok={false}>No active subscription</ResultBox>}>
                <ResultBox ok={true}>
                  Active — {subStatus} · {planSlug}
                </ResultBox>
              </WhenSubscription>
            </SubSection>

            <SubSection title="WhenNoSubscription" code="<WhenNoSubscription>">
              <WhenNoSubscription fallbackComponent={<ResultBox ok={true}>You have a subscription</ResultBox>}>
                <ResultBox ok={false}>No subscription found</ResultBox>
              </WhenNoSubscription>
            </SubSection>

            <SubSection
              title={`WhenSubscriptionToPlans ["${planSlug}"]`}
              code={`<WhenSubscriptionToPlans plans={["${planSlug}"]}`}
            >
              {planSlug !== "none" ? (
                <WhenSubscriptionToPlans
                  plans={[planSlug]}
                  fallbackComponent={<ResultBox ok={false}>Not on plan "{planSlug}"</ResultBox>}
                >
                  <ResultBox ok={true}>On plan "{planSlug}"</ResultBox>
                </WhenSubscriptionToPlans>
              ) : (
                <p className="text-xs text-gray-400">No plan found</p>
              )}
            </SubSection>
          </div>

          {/* Feature / Workspace HOCs */}
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            3.2 Workspace Feature HOCs — <TypePill type="feature" />
          </h3>
          <div className="mb-5 grid gap-3 sm:grid-cols-2">
            <SubSection
              title={`WhenWorkspaceFeatureEnabled  slug="${FEATURE_ANALYTICS}"`}
              code={`<WhenWorkspaceFeatureEnabled slug="${FEATURE_ANALYTICS}">`}
            >
              <WhenWorkspaceFeatureEnabled slug={FEATURE_ANALYTICS}>
                <ResultBox ok={true}>analytics is enabled on this workspace</ResultBox>
              </WhenWorkspaceFeatureEnabled>
            </SubSection>

            <SubSection
              title="WhenWorkspaceFeatureDisabled — disabled feature"
              code='<WhenWorkspaceFeatureDisabled slug="...">'
            >
              {disabledWsFeatures.length > 0 && disabledWsFeatures[0] ? (
                <WhenWorkspaceFeatureDisabled slug={disabledWsFeatures[0]}>
                  <ResultBox ok={false}>"{disabledWsFeatures[0]}" is disabled on this workspace</ResultBox>
                </WhenWorkspaceFeatureDisabled>
              ) : (
                <p className="text-xs text-gray-400">All workspace features are currently enabled</p>
              )}
            </SubSection>
          </div>

          {/* Role HOCs */}
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            3.3 Role HOCs
          </h3>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <SubSection title="WhenRoles — APP role (admin / user)" code={`<WhenRoles roles={["${userRole}"]}`}>
              {userRole !== "none" ? (
                <WhenRoles
                  roles={[userRole]}
                  fallback={<ResultBox ok={false}>APP role "{userRole}" not matched</ResultBox>}
                >
                  <ResultBox ok={true}>APP role "{userRole}" matched</ResultBox>
                </WhenRoles>
              ) : (
                <p className="text-xs text-gray-400">No APP role on user</p>
              )}
            </SubSection>

            <SubSection title="WhenWorkspaceRoles — workspace role" code={`<WhenWorkspaceRoles roles={["${wsRole}"]}`}>
              {wsRole !== "none" ? (
                <WhenWorkspaceRoles
                  roles={[wsRole]}
                  fallback={<ResultBox ok={false}>Workspace role "{wsRole}" not matched</ResultBox>}
                >
                  <ResultBox ok={true}>Workspace role "{wsRole}" matched</ResultBox>
                </WhenWorkspaceRoles>
              ) : (
                <p className="text-xs text-gray-400">No workspace role found</p>
              )}
            </SubSection>
          </div>
        </SectionCard>

        {/* ── SECTION 4: Trial Gates ──────────────────────────────────────── */}
        <SectionCard
          title="4. Trial Status Gates"
          subtitle="useTrialStatus + WhenTrialing / WhenNotTrialing / WhenTrialEnding. Subscription actions handled by SDK modal."
        >
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 dark:border-teal-800 dark:bg-teal-900/20">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-teal-700 dark:text-teal-400">
                useTrialStatus()
              </p>
              <Row label="isTrialing">
                <StatusBadge value={isTrialing} />
              </Row>
              <Row label="isTrialEnding">
                <StatusBadge value={isTrialEnding} />
              </Row>
              <Row label="daysRemaining">
                <span className="font-mono text-xs">{daysRemaining ?? "—"}</span>
              </Row>
            </div>

            <SubSection title="WhenTrialing" code="<WhenTrialing>">
              <WhenTrialing fallbackComponent={<ResultBox ok={false}>Not trialing</ResultBox>}>
                <ResultBox ok={true}>On trial — {daysRemaining} days left</ResultBox>
              </WhenTrialing>
            </SubSection>

            <SubSection title="WhenNotTrialing" code="<WhenNotTrialing>">
              <WhenNotTrialing fallbackComponent={<ResultBox ok={false}>Currently trialing</ResultBox>}>
                <ResultBox ok={true}>Paid / expired trial</ResultBox>
              </WhenNotTrialing>
            </SubSection>

            <SubSection title="WhenTrialEnding (≤7 days)" code="<WhenTrialEnding daysThreshold={7}>">
              <WhenTrialEnding
                daysThreshold={7}
                fallbackComponent={<ResultBox ok={true}>More than 7 days left</ResultBox>}
              >
                <ResultBox ok={false}>Ends in &lt;7 days!</ResultBox>
              </WhenTrialEnding>
            </SubSection>
          </div>
        </SectionCard>

        {/* ── SECTION 5: Our Custom UI Components ────────────────────────── */}
        <SectionCard
          title="5. App-Level Gate UI Components"
          subtitle="SubscriptionStatusBanner, FeatureGate, FeatureButton, useFeatureGate — built on top of the SDK."
        >
          {/* 5.1 SubscriptionStatusBanner */}
          <SubSection title="5.1 SubscriptionStatusBanner" code="<SubscriptionStatusBanner />">
            <div className="overflow-hidden rounded border border-gray-200 dark:border-gray-600">
              <div className="bg-gray-100 px-3 py-1 text-xs text-gray-400 dark:bg-gray-700 dark:text-gray-500">
                Live preview — priority: past_due → canceled → trial ending ≤3 days → trialing
              </div>
              <SubscriptionStatusBanner />
              <WhenSubscription
                fallbackComponent={
                  <div className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">
                    No active subscription — no banner shown.
                  </div>
                }
              >
                <WhenTrialing fallbackComponent={null}>
                  <div className="border-t px-4 py-2 text-xs text-gray-400 dark:border-gray-600 dark:text-gray-500">
                    ↑ Trial banner active
                  </div>
                </WhenTrialing>
              </WhenSubscription>
            </div>
          </SubSection>

          {/* 5.2 FeatureGate — all real slugs */}
          <h3 className="mb-3 mt-5 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            5.2 FeatureGate — all real slugs
          </h3>
          <div className="mb-5 grid gap-3 sm:grid-cols-2">
            {/* analytics — feature flag */}
            <SubSection
              title={`analytics  ·  state: ${stateAnalytics}`}
              code={`<FeatureGate featureSlug="${FEATURE_ANALYTICS}">  // feature`}
            >
              <FeatureGate
                featureSlug={FEATURE_ANALYTICS}
                fallback={<UpgradeFallback slug="analytics" />}
                loadingFallback={
                  <div className="rounded bg-gray-100 p-2 text-xs text-gray-400 dark:bg-gray-700">Loading…</div>
                }
              >
                <ResultBox ok={true}>
                  ✅ <strong>analytics</strong> flag is ON — render analytics dashboard here
                </ResultBox>
              </FeatureGate>
            </SubSection>

            {/* analytics + additionalCondition role check */}
            <SubSection
              title="analytics + additionalCondition=false (viewer)"
              code={`<FeatureGate featureSlug="${FEATURE_ANALYTICS}" additionalCondition={isEditor}>`}
            >
              <FeatureGate
                featureSlug={FEATURE_ANALYTICS}
                additionalCondition={false}
                fallback={
                  <div className="rounded border-l-4 border-yellow-400 bg-yellow-50 p-3 text-sm dark:bg-yellow-900/20">
                    <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                      🔒 Feature on — but role check failed (viewer has no write access)
                    </p>
                  </div>
                }
              >
                <ResultBox ok={true}>Editor/Admin — write access</ResultBox>
              </FeatureGate>
            </SubSection>

            {/* max-test — hard limit */}
            <SubSection
              title={`max-test  ·  state: ${stateMaxTest}`}
              code={`<FeatureGate featureSlug="${LIMIT_MAX_TEST}">  // limit (cap=24)`}
            >
              <FeatureGate
                featureSlug={LIMIT_MAX_TEST}
                fallback={<LimitFallback slug="max-test" reason="24 test limit reached, cannot create more" />}
                loadingFallback={
                  <div className="rounded bg-gray-100 p-2 text-xs text-gray-400 dark:bg-gray-700">Loading…</div>
                }
              >
                <ResultBox ok={true}>
                  ✅ <strong>max-test</strong> under limit (cap: 24) — test creation allowed
                </ResultBox>
              </FeatureGate>
            </SubSection>

            {/* max-users — hard limit */}
            <SubSection
              title={`max-users  ·  state: ${stateMaxUsers}`}
              code={`<FeatureGate featureSlug="${LIMIT_MAX_USERS}">  // limit (cap=10)`}
            >
              <FeatureGate
                featureSlug={LIMIT_MAX_USERS}
                fallback={<LimitFallback slug="max-users" reason="10 member limit reached, cannot invite more" />}
                loadingFallback={
                  <div className="rounded bg-gray-100 p-2 text-xs text-gray-400 dark:bg-gray-700">Loading…</div>
                }
              >
                <ResultBox ok={true}>
                  ✅ <strong>max-users</strong> under limit (cap: 10) — member invite allowed
                </ResultBox>
              </FeatureGate>
            </SubSection>

            {/* videos — quota */}
            <SubSection
              title={`videos  ·  state: ${stateVideos}`}
              code={`<FeatureGate featureSlug="${QUOTA_VIDEOS}" quotaSlug="${QUOTA_VIDEOS}">  // quota`}
            >
              <FeatureGate
                featureSlug={QUOTA_VIDEOS}
                quotaSlug={QUOTA_VIDEOS}
                fallback={
                  <div className="rounded border-l-4 border-orange-400 bg-orange-50 p-3 text-sm dark:bg-orange-900/20">
                    <p className="font-semibold text-orange-800 dark:text-orange-200">
                      ⚡ <strong>videos</strong> quota exhausted (2/month included). Overage: $2 per 100 videos.
                    </p>
                  </div>
                }
                loadingFallback={
                  <div className="rounded bg-gray-100 p-2 text-xs text-gray-400 dark:bg-gray-700">Loading…</div>
                }
              >
                <ResultBox ok={true}>
                  ✅ <strong>videos</strong> quota OK — video upload allowed (2/month included, then $2/100)
                </ResultBox>
              </FeatureGate>
            </SubSection>

            {/* not in plan */}
            <SubSection
              title={`enterprise-sso  ·  state: ${stateNotInPlan}`}
              code={`<FeatureGate featureSlug="${NOT_IN_PLAN}">  // not in plan`}
            >
              <FeatureGate featureSlug={NOT_IN_PLAN} fallback={<UpgradeFallback slug="enterprise-sso" />}>
                <ResultBox ok={true}>enterprise-sso accessible (unexpected)</ResultBox>
              </FeatureGate>
            </SubSection>
          </div>

          {/* 5.3 FeatureButton */}
          <SubSection
            title="5.3 FeatureButton — all gate states side by side"
            code="<FeatureButton featureSlug={...} onExecute={...}>"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* OK — feature */}
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-semibold uppercase text-gray-500">OK</p>
                  <TypePill type="feature" />
                </div>
                <FeatureButton
                  featureSlug={FEATURE_ANALYTICS}
                  featureName="Analytics"
                  onExecute={() => alert("✅ analytics — action executed")}
                  variant="default"
                  size="sm"
                >
                  View Analytics
                </FeatureButton>
                <p className="text-xs text-gray-400">No icon. Executes immediately.</p>
              </div>

              {/* OK — quota */}
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-semibold uppercase text-gray-500">OK / EXHAUSTED</p>
                  <TypePill type="quota" />
                </div>
                <FeatureButton
                  featureSlug={QUOTA_VIDEOS}
                  quotaSlug={QUOTA_VIDEOS}
                  featureName="Videos"
                  onExecute={() => alert("✅ videos quota OK — upload executed")}
                  variant="default"
                  size="sm"
                >
                  Upload Video
                </FeatureButton>
                <p className="text-xs text-gray-400">Zap icon if quota exhausted → opens upgrade dialog.</p>
              </div>

              {/* NOT_INCLUDED */}
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-semibold uppercase text-gray-500">NOT_INCLUDED</p>
                  <TypePill type="none" />
                </div>
                <FeatureButton
                  featureSlug={NOT_IN_PLAN}
                  featureName="Enterprise SSO"
                  onExecute={() => alert("executed")}
                  variant="outline"
                  size="sm"
                  denialDescription="Enterprise SSO lets your team log in via Okta, Azure AD, or Google Workspace. Available on Enterprise plans."
                  upgradePath="/settings/billing"
                >
                  Configure SSO
                </FeatureButton>
                <p className="text-xs text-gray-400">Crown icon + tooltip. Click → FeatureAccessDeniedDialog.</p>
              </div>

              {/* NOT_PERMITTED */}
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-semibold uppercase text-gray-500">NOT_PERMITTED</p>
                </div>
                <FeatureButton
                  featureSlug={FEATURE_ANALYTICS}
                  featureName="Analytics Export"
                  hasPermission={false}
                  onExecute={() => alert("executed")}
                  variant="outline"
                  size="sm"
                >
                  Export Data
                </FeatureButton>
                <p className="text-xs text-gray-400">Lock icon. Disabled. Tooltip: contact workspace admin.</p>
              </div>
            </div>

            <div className="mt-4 rounded bg-gray-50 p-3 text-xs text-gray-500 dark:bg-gray-900 dark:text-gray-400">
              <strong>FeatureAccessDeniedDialog</strong> — Crown (NOT_INCLUDED) → upgrade CTA · Zap (EXHAUSTED) →
              increase quota · Lock (NOT_PERMITTED) → contact admin. Registered in <code>dialogs/setup.ts</code>, opened
              via <code>useAppDialogManager</code>.
            </div>
          </SubSection>

          {/* 5.4 useFeatureGate raw */}
          <SubSection
            title="5.4 useFeatureGate — raw state for every real slug"
            code="const { state } = useFeatureGate(slug, options?)"
          >
            <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-5">
              {[
                { slug: FEATURE_ANALYTICS, state: stateAnalytics, type: "feature" as const },
                { slug: LIMIT_MAX_TEST, state: stateMaxTest, type: "limit" as const },
                { slug: LIMIT_MAX_USERS, state: stateMaxUsers, type: "limit" as const },
                { slug: QUOTA_VIDEOS, state: stateVideos, type: "quota" as const },
                { slug: NOT_IN_PLAN, state: stateNotInPlan, type: "none" as const },
              ].map(({ slug, state, type }) => (
                <div
                  key={slug}
                  className="rounded border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900"
                >
                  <p className="mb-1 font-mono text-xs text-gray-600 dark:text-gray-400">{slug}</p>
                  <TypePill type={type} />
                  <div className="mt-2">
                    <GateBadge state={state} />
                  </div>
                </div>
              ))}
            </div>
            <pre className="mt-3 overflow-x-auto rounded bg-gray-100 p-3 text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-300">
              {`// Feature flag
const { state } = useFeatureGate("analytics");

// Hard limit (no quotaSlug — SDK checks count vs cap)
const { state } = useFeatureGate("max-test");
const { state } = useFeatureGate("max-users");

// Quota (pass quotaSlug — SDK checks consumed vs included)
const { state } = useFeatureGate("videos", { quotaSlug: "videos" });

// States
FEATURE_STATES.OK           → allow action
FEATURE_STATES.EXHAUSTED    → quota used up (QUOTA only) → read-only or overage prompt
FEATURE_STATES.NOT_INCLUDED → not in plan → upgrade CTA
FEATURE_STATES.NOT_PERMITTED → no role permission → contact admin
FEATURE_STATES.LOADING      → subscription data loading`}
            </pre>
          </SubSection>
        </SectionCard>

        {/* ── SECTION 6: Usage Tracking (Quotas only) ─────────────────────── */}
        <SectionCard
          title="6. Usage Tracking — Quotas only"
          subtitle="Record and check usage for videos quota. Limits (max-test, max-users) are hard caps — SDK enforces them at gate time, no usage recording needed."
        >
          {!workspaceId && (
            <div className="mb-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
              ⚠ No workspace selected — hooks paused until workspaceId is available.
            </div>
          )}

          <div className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm dark:border-indigo-800 dark:bg-indigo-900/20">
            <p className="font-semibold text-indigo-800 dark:text-indigo-200">Which slugs apply here?</p>
            <ul className="mt-1 space-y-1 text-xs text-indigo-700 dark:text-indigo-300">
              <li>
                ✅ <strong>videos</strong> (quota) — record each video upload; SDK tracks consumed vs included (2/month)
              </li>
              <li>
                ❌ <strong>max-test</strong> (limit) — hard cap, SDK enforces at gate time; do not call{" "}
                <code>record()</code>
              </li>
              <li>
                ❌ <strong>max-users</strong> (limit) — same as above; enforce via FeatureGate, not usage API
              </li>
            </ul>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Record */}
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-purple-700 dark:text-purple-400">
                1. Record Usage
              </p>
              <p className="mb-3 text-xs text-purple-600 dark:text-purple-300">POST /api/saas/usage/record</p>
              <div className="mb-3 space-y-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-purple-800 dark:text-purple-300">
                    Quota slug
                  </label>
                  <select
                    value={QUOTA_VIDEOS}
                    disabled
                    className="w-full rounded border border-purple-300 bg-white px-2 py-1 text-sm dark:border-purple-600 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value={QUOTA_VIDEOS}>videos (quota)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-purple-800 dark:text-purple-300">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={recordQty}
                    onChange={e => setRecordQty(Number(e.target.value))}
                    className="w-full rounded border border-purple-300 bg-white px-2 py-1 text-sm dark:border-purple-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    workspaceId &&
                    record({ workspaceId, quotaSlug: QUOTA_VIDEOS, quantity: recordQty, source: "test-page" })
                  }
                  disabled={recLoading || !workspaceId}
                  className="flex-1 rounded bg-purple-600 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {recLoading ? "Recording…" : "Record"}
                </button>
                {recData && (
                  <button
                    onClick={resetRec}
                    className="rounded border border-purple-300 px-2 py-1.5 text-xs text-purple-700 hover:bg-purple-100 dark:text-purple-300"
                  >
                    Clear
                  </button>
                )}
              </div>
              {recError && <p className="mt-2 text-xs text-red-600">{recError}</p>}
              {recData && (
                <pre
                  className={`mt-2 overflow-auto rounded p-2 text-xs ${recData.success ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"}`}
                >
                  {JSON.stringify(recData, null, 2)}
                </pre>
              )}
            </div>

            {/* Quota Status */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-400">
                2. Quota Status
              </p>
              <p className="mb-3 text-xs text-blue-600 dark:text-blue-300">GET /api/saas/usage/status</p>
              <div className="mb-3">
                <label className="mb-1 block text-xs font-medium text-blue-800 dark:text-blue-300">Quota slug</label>
                <select
                  value={statusSlug}
                  onChange={e => setStatusSlug(e.target.value)}
                  className="w-full rounded border border-blue-300 bg-white px-2 py-1 text-sm dark:border-blue-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value={QUOTA_VIDEOS}>videos (quota)</option>
                </select>
              </div>
              <button
                onClick={refetchStatus}
                disabled={statusLoading || !workspaceId}
                className="w-full rounded bg-blue-600 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {statusLoading ? "Fetching…" : "Fetch Status"}
              </button>
              {statusError && <p className="mt-2 text-xs text-red-600">{statusError}</p>}
              {quotaStatus && (
                <div className="mt-3 space-y-1 rounded bg-white p-3 text-xs dark:bg-gray-700">
                  <Row label="Slug">
                    <span className="font-mono font-medium">{quotaStatus.quotaSlug}</span>
                  </Row>
                  <Row label="Consumed">
                    <span className="font-medium">{quotaStatus.consumed}</span>
                  </Row>
                  <Row label="Included">
                    <span className="font-medium">{quotaStatus.included}</span>
                  </Row>
                  <Row label="Available">
                    <span className="font-medium">{quotaStatus.available}</span>
                  </Row>
                  <Row label="Overage">
                    <span className={`font-medium ${quotaStatus.hasOverage ? "text-red-600" : "text-green-600"}`}>
                      {quotaStatus.hasOverage ? `Yes (+${quotaStatus.overage})` : "No"}
                    </span>
                  </Row>
                  {quotaStatus.included > 0 && (
                    <div className="mt-2">
                      <div className="mb-1 flex justify-between text-gray-400">
                        <span>Usage</span>
                        <span>{Math.round((quotaStatus.consumed / quotaStatus.included) * 100)}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-600">
                        <div
                          className={`h-full rounded-full ${quotaStatus.available <= 0 ? "bg-red-500" : quotaStatus.hasOverage ? "bg-orange-500" : "bg-blue-500"}`}
                          style={{ width: `${Math.min(100, (quotaStatus.consumed / quotaStatus.included) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* All Quotas */}
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-green-700 dark:text-green-400">
                3. All Quotas
              </p>
              <p className="mb-3 text-xs text-green-600 dark:text-green-300">GET /api/saas/usage/all</p>
              <button
                onClick={refetchAll}
                disabled={allLoading || !workspaceId}
                className="w-full rounded bg-green-600 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {allLoading ? "Fetching…" : "Fetch All"}
              </button>
              {allError && <p className="mt-2 text-xs text-red-600">{allError}</p>}
              {allQuotas && (
                <div className="mt-3 space-y-2">
                  {Object.keys(allQuotas).length === 0 ? (
                    <p className="text-xs text-gray-400">No quota usage recorded yet.</p>
                  ) : (
                    Object.entries(allQuotas).map(([slug, quota]) => (
                      <div key={slug} className="rounded bg-white p-2 text-xs dark:bg-gray-700">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="font-mono font-semibold">{slug}</span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-xs font-medium ${quota.available <= 0 ? "bg-red-100 text-red-700" : quota.hasOverage ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}
                          >
                            {quota.available <= 0 ? "Exhausted" : quota.hasOverage ? "Overage" : "OK"}
                          </span>
                        </div>
                        <div className="text-gray-500">
                          {quota.consumed} / {quota.included}
                          {quota.available > 0 ? ` (${quota.available} left)` : ""}
                        </div>
                        {quota.included > 0 && (
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-600">
                            <div
                              className={`h-full rounded-full ${quota.available <= 0 ? "bg-red-500" : quota.hasOverage ? "bg-orange-500" : "bg-green-500"}`}
                              style={{ width: `${Math.min(100, (quota.consumed / quota.included) * 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        {/* ── Quick Reference ─────────────────────────────────────────────── */}
        <div className="rounded-xl border-l-4 border-blue-500 bg-blue-50 p-5 dark:bg-blue-900/20">
          <h2 className="mb-3 text-sm font-bold text-blue-900 dark:text-blue-200">Quick Reference — Your Plan Slugs</h2>
          <div className="grid gap-4 text-xs text-blue-800 sm:grid-cols-2 md:grid-cols-4 dark:text-blue-300">
            <div>
              <p className="mb-1 font-bold">
                analytics <TypePill type="feature" />
              </p>
              <ul className="space-y-0.5">
                <li>Boolean flag — on/off per workspace</li>
                <li>
                  <code>useFeatureGate("analytics")</code>
                </li>
                <li>
                  <code>&lt;FeatureGate featureSlug="analytics"&gt;</code>
                </li>
                <li>No quotaSlug needed</li>
              </ul>
            </div>
            <div>
              <p className="mb-1 font-bold">
                max-test, max-users <TypePill type="limit" />
              </p>
              <ul className="space-y-0.5">
                <li>Hard caps (24 tests, 10 users)</li>
                <li>
                  <code>useFeatureGate("max-test")</code>
                </li>
                <li>SDK checks resource count vs cap</li>
                <li>
                  Do NOT call <code>record()</code> for limits
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-1 font-bold">
                videos <TypePill type="quota" />
              </p>
              <ul className="space-y-0.5">
                <li>2/month included, $2 overage/100</li>
                <li>
                  <code>useFeatureGate("videos", {'{ quotaSlug: "videos" }'})</code>
                </li>
                <li>EXHAUSTED state → overage prompt</li>
                <li>
                  Call <code>record()</code> on each upload
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-1 font-bold">Gate states</p>
              <ul className="space-y-0.5">
                <li>
                  <code>ok</code> — allow
                </li>
                <li>
                  <code>exhausted</code> — quota over (quotas only)
                </li>
                <li>
                  <code>not_included</code> — upgrade required
                </li>
                <li>
                  <code>not_permitted</code> — role blocked
                </li>
                <li>
                  <code>loading</code> — wait
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
