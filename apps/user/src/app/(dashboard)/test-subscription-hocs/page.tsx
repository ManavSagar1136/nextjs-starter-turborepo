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
  useServerUsageLogs,
  usePushNotifications,
  useLimitCheck,
  useSDKAuth,
  useInvoices,
  useBillingPortal,
  useCancelSubscription,
  useResumeSubscription,
  useSeatStatus,
  useUserAttributes,
  useRecordUsage,
  useQuotaUsageStatus,
  useAllQuotaUsage,
  useUsageLogs,
  WhenQuotaAvailable,
  WhenQuotaExhausted,
  WhenQuotaOverage,
  WhenQuotaThreshold,
  // Auth HOCs
  WhenAuthenticated,
  WhenUnauthenticated,
  // Feature HOC
  WhenUserFeatureDisabled,
  // SDK OS / Settings
  useSaaSOs,
  useSaaSSettings,
  // Quota context
  useQuotaUsageContext,
  // Plan group & checkout
  usePlanGroup,
  usePlanGroupVersions,
  useCreateCheckoutSession,
  useUpdateSubscription,
  // Single invoice
  useInvoice,
  // Public pricing
  usePublicPlans,
  PricingPage,
  usePublicPlanGroupVersion,
  // i18n
  useTranslation,
  SUPPORTED_LOCALES,
  // Workspace UI
  WorkspaceSwitcher,
  SETTINGS_SCREENS,
  // Permissions
  WhenPermission,
  usePermissions,
  // Beta form
  BetaForm,
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

// accent colours: blue | emerald | teal | purple | orange | slate | rose | amber
type GroupColor = "blue" | "emerald" | "teal" | "purple" | "orange" | "slate" | "rose" | "amber";

const GROUP_STYLES: Record<GroupColor, { border: string; header: string; badge: string }> = {
  blue: {
    border: "border-blue-400",
    header: "bg-blue-50 dark:bg-blue-900/30",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
  emerald: {
    border: "border-emerald-400",
    header: "bg-emerald-50 dark:bg-emerald-900/30",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  },
  teal: {
    border: "border-teal-400",
    header: "bg-teal-50 dark:bg-teal-900/30",
    badge: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
  },
  purple: {
    border: "border-purple-400",
    header: "bg-purple-50 dark:bg-purple-900/30",
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  },
  orange: {
    border: "border-orange-400",
    header: "bg-orange-50 dark:bg-orange-900/30",
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  },
  slate: {
    border: "border-slate-400",
    header: "bg-slate-50 dark:bg-slate-800/60",
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  rose: {
    border: "border-rose-400",
    header: "bg-rose-50 dark:bg-rose-900/30",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
  },
  amber: {
    border: "border-amber-400",
    header: "bg-amber-50 dark:bg-amber-900/30",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  },
};

function GroupCard({
  number,
  title,
  subtitle,
  color,
  children,
}: {
  number: number;
  title: string;
  subtitle: string;
  color: GroupColor;
  children: React.ReactNode;
}) {
  const s = GROUP_STYLES[color];
  return (
    <div
      className={`rounded-xl border-l-4 ${s.border} border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800`}
    >
      <div className={`rounded-t-xl px-6 py-4 ${s.header}`}>
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${s.badge}`}
          >
            {number}
          </span>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">{title}</h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
      <h3 className="mb-1 text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
      {subtitle && <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
      <div className="mt-3">{children}</div>
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

  const {
    logs: usageLogs,
    totalDocs: logsTotalDocs,
    totalPages: logsTotalPages,
    page: logsPage,
    hasNextPage: logsHasNextPage,
    isLoading: logsLoading,
    error: logsError,
    refetch: refetchLogs,
  } = useServerUsageLogs({ workspaceId: workspaceId ?? "", quotaSlug: QUOTA_VIDEOS, limit: 5 });

  // ── Push notifications ─────────────────────────────────────────────────────
  const {
    permission,
    isSubscribed,
    isSupported,
    loading: pushLoading,
    error: pushError,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  // ── Send notification form ─────────────────────────────────────────────────
  const [notifEventSlug, setNotifEventSlug] = useState("test-notification");
  const [notifUserId, setNotifUserId] = useState("");
  const [notifTitle, setNotifTitle] = useState("Hello from the test panel!");
  const [notifMessage, setNotifMessage] = useState("This is a test notification sent from the SDK test page.");
  const [notifUrl, setNotifUrl] = useState("");
  const [sendLoading, setSendLoading] = useState(false);
  const [sendResult, setSendResult] = useState<Record<string, unknown> | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  // ── SDK dialog actions ─────────────────────────────────────────────────────
  const { openWorkspaceSettings, openSubscriptionSettings } = useSDKAuth();

  // ── useLimitCheck ──────────────────────────────────────────────────────────
  const { limit: limitMaxTest, isAtLimit: isAtLimitTest, remaining: remainingTest } = useLimitCheck(LIMIT_MAX_TEST);
  const { limit: limitMaxUsers, isAtLimit: isAtLimitUsers, remaining: remainingUsers } = useLimitCheck(LIMIT_MAX_USERS);
  const [simulatedTestCount, setSimulatedTestCount] = useState(0);
  const [simulatedUserCount, setSimulatedUserCount] = useState(0);

  // ── Invoices & billing ─────────────────────────────────────────────────────
  const {
    invoices,
    hasMore: invoicesHasMore,
    loading: invoicesLoading,
    error: invoicesError,
    refetch: refetchInvoices,
  } = useInvoices(workspaceId, 5);
  const { openBillingPortal, loading: billingPortalLoading, error: billingPortalError } = useBillingPortal(workspaceId);
  const { cancelSubscription, loading: cancelLoading, error: cancelError } = useCancelSubscription(workspaceId);
  const { resumeSubscription, loading: resumeLoading, error: resumeError } = useResumeSubscription(workspaceId);
  const [cancelResult, setCancelResult] = useState<string | null>(null);
  const [resumeResult, setResumeResult] = useState<string | null>(null);

  // ── Seats & user attributes ────────────────────────────────────────────────
  const seatStatus = useSeatStatus(currentWorkspace ?? null);
  const {
    attributes: userAttributes,
    isLoading: attrsLoading,
    error: attrsError,
    refreshAttributes,
  } = useUserAttributes();

  // ── Client-side quota hooks (direct SDK — no proxy) ────────────────────────
  const {
    recordUsage: recordUsageDirect,
    loading: recDirectLoading,
    error: recDirectError,
  } = useRecordUsage(workspaceId);
  const [recDirectResult, setRecDirectResult] = useState<Record<string, unknown> | null>(null);
  const [recDirectQty, setRecDirectQty] = useState(1);

  const {
    status: directQuotaStatus,
    loading: directStatusLoading,
    error: directStatusError,
    refetch: refetchDirectStatus,
  } = useQuotaUsageStatus(workspaceId, QUOTA_VIDEOS);

  const {
    quotas: directAllQuotas,
    loading: directAllLoading,
    error: directAllError,
    refetch: refetchDirectAll,
  } = useAllQuotaUsage(workspaceId);

  const {
    logs: directLogs,
    totalDocs: directLogsTotalDocs,
    totalPages: directLogsTotalPages,
    page: directLogsPage,
    hasNextPage: directLogsHasNext,
    loading: directLogsLoading,
    error: directLogsError,
  } = useUsageLogs(workspaceId, QUOTA_VIDEOS, { limit: 5 });

  // ── SDK OS / Settings ─────────────────────────────────────────────────────
  const osState = useSaaSOs();
  const { settings, getSettings } = useSaaSSettings();
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsFetched, setSettingsFetched] = useState(false);

  // ── Quota usage context (raw) ──────────────────────────────────────────────
  const {
    quotas: ctxQuotas,
    loading: ctxQuotasLoading,
    error: ctxQuotasError,
    refetch: refetchCtxQuotas,
  } = useQuotaUsageContext();

  // ── Plan group & versions ──────────────────────────────────────────────────
  const {
    planGroup: planGroupData,
    loading: planGroupLoading,
    error: planGroupError,
    refetch: refetchPlanGroup,
  } = usePlanGroup(workspaceId);
  const {
    versions: planGroupVersions,
    loading: versionsLoading,
    error: versionsError,
    refetch: refetchVersions,
  } = usePlanGroupVersions(workspaceId);

  // ── Checkout / upgrade ─────────────────────────────────────────────────────
  const {
    createCheckoutSession,
    loading: checkoutLoading,
    error: checkoutError,
  } = useCreateCheckoutSession(workspaceId);
  const { updateSubscription, loading: updateSubLoading, error: updateSubError } = useUpdateSubscription(workspaceId);
  const [checkoutResult, setCheckoutResult] = useState<Record<string, unknown> | null>(null);
  const [updateSubResult, setUpdateSubResult] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState("");

  // ── Single invoice ─────────────────────────────────────────────────────────
  const [invoiceId, setInvoiceId] = useState("");
  const [queriedInvoiceId, setQueriedInvoiceId] = useState<string | null>(null);
  const {
    invoice: singleInvoice,
    loading: singleInvoiceLoading,
    error: singleInvoiceError,
  } = useInvoice(workspaceId, queriedInvoiceId);

  // ── i18n ──────────────────────────────────────────────────────────────────
  const { t, locale, dir, fmtNum, fmtCents } = useTranslation();

  // ── Public plans ──────────────────────────────────────────────────────────
  const [publicPlanSlug, setPublicPlanSlug] = useState("main-pricing");
  const [queriedPublicSlug, setQueriedPublicSlug] = useState<string | null>(null);
  const {
    items: publicItems,
    plans: publicPlans,
    loading: publicPlansLoading,
    error: publicPlansError,
  } = usePublicPlans(queriedPublicSlug ?? "");
  const {
    planGroupVersion: publicGroupVersion,
    loading: pgvLoading,
    error: pgvError,
  } = usePublicPlanGroupVersion(queriedPublicSlug);

  // ── Permissions ────────────────────────────────────────────────────────────
  const { can: canPermission, permissions: userPermissions, isOwner: permIsOwner, role: permRole } = usePermissions();

  async function handleSendNotification() {
    if (!workspaceId) return;
    setSendLoading(true);
    setSendResult(null);
    setSendError(null);
    try {
      const body: Record<string, unknown> = {
        workspaceId,
        eventSlug: notifEventSlug,
        data: {
          ...(notifTitle ? { title: notifTitle } : {}),
          ...(notifMessage ? { message: notifMessage } : {}),
          ...(notifUrl ? { url: notifUrl } : {}),
        },
      };
      if (notifUserId.trim()) body.userId = notifUserId.trim();

      const res = await fetch("/api/saas/notification/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setSendError(json.error || `HTTP ${res.status}`);
      } else {
        setSendResult(json);
      }
    } catch (e) {
      setSendError(e instanceof Error ? e.message : String(e));
    } finally {
      setSendLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* ── Page Header ───────────────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SDK Test Panel</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Every hook, HOC, and component from{" "}
                <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">@buildbase/saas-sdk</code> — live, against your
                real plan.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { slug: "analytics", type: "feature" as const, note: "flag" },
                { slug: "max-test", type: "limit" as const, note: "cap 24" },
                { slug: "max-users", type: "limit" as const, note: "cap 10" },
                { slug: "videos", type: "quota" as const, note: "2/mo" },
                { slug: "enterprise-sso", type: "none" as const, note: "not in plan" },
              ].map(({ slug, type, note }) => (
                <div
                  key={slug}
                  className="flex items-center gap-1 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
                >
                  <code className="text-gray-700 dark:text-gray-300">{slug}</code>
                  <TypePill type={type} />
                  <span className="text-gray-400">{note}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Status banner */}
          <div className="mt-4 overflow-hidden rounded border border-gray-100 dark:border-gray-700">
            <SubscriptionStatusBanner />
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            GROUP 1 · AUTH & USER
        ══════════════════════════════════════════════════════════════════ */}
        <GroupCard
          number={1}
          title="Auth & User"
          color="blue"
          subtitle="Authentication state, workspace, roles, user attributes, SDK dialog launchers, OS config."
        >
          {/* Auth state */}
          <SectionCard title="Auth State" subtitle="useSDKAuth · useSaaSAuth · WhenAuthenticated · WhenUnauthenticated">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-blue-100 bg-white p-3 text-xs dark:border-blue-900 dark:bg-gray-800">
                <p className="mb-2 font-bold text-blue-700 dark:text-blue-400">useSDKAuth()</p>
                <Row label="userId">
                  <span className="max-w-[120px] truncate font-mono text-xs">{user?.id ?? "—"}</span>
                </Row>
                <Row label="name">
                  <span>{user?.name ?? "—"}</span>
                </Row>
                <Row label="email">
                  <span className="text-xs">{user?.email ?? "—"}</span>
                </Row>
                <Row label="authenticated">
                  <StatusBadge value={!!user} />
                </Row>
              </div>
              <SubSection title="WhenAuthenticated" code="<WhenAuthenticated>">
                <WhenAuthenticated>
                  <ResultBox ok={true}>Authenticated — session active</ResultBox>
                </WhenAuthenticated>
                <WhenUnauthenticated>
                  <ResultBox ok={false}>Not authenticated</ResultBox>
                </WhenUnauthenticated>
              </SubSection>
              <SubSection title="WhenUnauthenticated" code="<WhenUnauthenticated>">
                <WhenUnauthenticated>
                  <ResultBox ok={false}>Not authenticated — show login</ResultBox>
                </WhenUnauthenticated>
                <WhenAuthenticated>
                  <ResultBox ok={true}>Authenticated (WhenUnauthenticated is hidden)</ResultBox>
                </WhenAuthenticated>
              </SubSection>
            </div>
          </SectionCard>

          {/* Roles */}
          <SectionCard title="Roles" subtitle="WhenRoles (APP level) · WhenWorkspaceRoles (workspace level)">
            <div className="mb-3 flex flex-wrap gap-2 text-xs">
              <div className="rounded border border-gray-200 bg-white px-2 py-1 dark:border-gray-700 dark:bg-gray-800">
                APP role: <code className="font-semibold text-blue-700 dark:text-blue-300">{userRole}</code>
              </div>
              <div className="rounded border border-gray-200 bg-white px-2 py-1 dark:border-gray-700 dark:bg-gray-800">
                Workspace role: <code className="font-semibold text-blue-700 dark:text-blue-300">{wsRole}</code>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <SubSection title="WhenRoles — APP role" code={`<WhenRoles roles={["${userRole}"]}`}>
                {userRole !== "none" ? (
                  <WhenRoles roles={[userRole]} fallback={<ResultBox ok={false}>APP role not matched</ResultBox>}>
                    <ResultBox ok={true}>APP role "{userRole}" matched</ResultBox>
                  </WhenRoles>
                ) : (
                  <p className="text-xs text-gray-400">No APP role on user</p>
                )}
              </SubSection>
              <SubSection title="WhenWorkspaceRoles" code={`<WhenWorkspaceRoles roles={["${wsRole}"]}`}>
                {wsRole !== "none" ? (
                  <WhenWorkspaceRoles
                    roles={[wsRole]}
                    fallback={<ResultBox ok={false}>Workspace role not matched</ResultBox>}
                  >
                    <ResultBox ok={true}>Workspace role "{wsRole}" matched</ResultBox>
                  </WhenWorkspaceRoles>
                ) : (
                  <p className="text-xs text-gray-400">No workspace role found</p>
                )}
              </SubSection>
            </div>
          </SectionCard>

          {/* User attributes */}
          <SectionCard
            title="User Attributes"
            subtitle="useUserAttributes — per-user key/value data stored in Buildbase"
          >
            <div className="mb-2 flex items-center gap-2">
              <button
                onClick={() => refreshAttributes()}
                disabled={attrsLoading}
                className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {attrsLoading ? "Loading…" : "Refresh"}
              </button>
              {attrsError && <p className="text-xs text-red-600">{String(attrsError)}</p>}
            </div>
            {Object.keys(userAttributes).length === 0 ? (
              <p className="text-xs text-gray-400">No user attributes configured.</p>
            ) : (
              <div className="grid gap-1 sm:grid-cols-2 md:grid-cols-3">
                {Object.entries(userAttributes).map(([k, v]) => (
                  <Row key={k} label={k}>
                    <span className="font-mono text-xs">{String(v)}</span>
                  </Row>
                ))}
              </div>
            )}
          </SectionCard>

          {/* SDK Dialogs */}
          <SectionCard
            title="SDK Dialog Launchers"
            subtitle="openWorkspaceSettings(section) · openSubscriptionSettings() — opens the Buildbase-hosted dialog"
          >
            <div className="flex flex-wrap gap-2">
              {(["profile", "general", "users", "subscription", "usage", "features", "danger"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => openWorkspaceSettings(s)}
                  className="rounded border border-blue-200 px-3 py-1 text-xs text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/40"
                >
                  {s}
                </button>
              ))}
              <button
                onClick={openSubscriptionSettings}
                className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
              >
                openSubscriptionSettings()
              </button>
            </div>
          </SectionCard>

          {/* OS / Settings */}
          <SectionCard
            title="SDK OS State & Org Settings"
            subtitle="useSaaSOs — loaded provider config · useSaaSSettings — org workspace settings"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-blue-100 bg-white p-3 dark:border-blue-900 dark:bg-gray-800">
                <p className="mb-2 text-xs font-bold text-blue-700 dark:text-blue-400">useSaaSOs()</p>
                <Row label="serverUrl">
                  <span className="max-w-[160px] truncate font-mono text-xs">{(osState as any).serverUrl || "—"}</span>
                </Row>
                <Row label="orgId">
                  <span className="font-mono text-xs">{(osState as any).orgId || "—"}</span>
                </Row>
                <Row label="hasAuth">
                  <StatusBadge value={!!(osState as any).auth} />
                </Row>
                <Row label="hasSettings">
                  <StatusBadge value={!!(osState as any).settings} />
                </Row>
              </div>
              <div className="rounded-lg border border-blue-100 bg-white p-3 dark:border-blue-900 dark:bg-gray-800">
                <p className="mb-2 text-xs font-bold text-blue-700 dark:text-blue-400">useSaaSSettings()</p>
                <button
                  onClick={async () => {
                    setSettingsLoading(true);
                    try {
                      await getSettings();
                      setSettingsFetched(true);
                    } finally {
                      setSettingsLoading(false);
                    }
                  }}
                  disabled={settingsLoading}
                  className="mb-2 rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {settingsLoading ? "Fetching…" : "Fetch Settings"}
                </button>
                {settings ? (
                  <>
                    <Row label="defaultRole">
                      <span className="font-mono text-xs">{settings.workspace?.defaultRole ?? "—"}</span>
                    </Row>
                    <Row label="roles">
                      <span className="text-xs">{settings.workspace?.roles?.join(", ") ?? "—"}</span>
                    </Row>
                    <Row label="maxWorkspaceUsers">
                      <span className="font-mono text-xs">{settings.workspace?.maxWorkspaceUsers ?? "—"}</span>
                    </Row>
                  </>
                ) : (
                  <p className="text-xs text-gray-400">
                    {settingsFetched ? "No settings returned." : "Click to fetch."}
                  </p>
                )}
              </div>
            </div>
          </SectionCard>
        </GroupCard>

        {/* ══════════════════════════════════════════════════════════════════
            GROUP 2 · SUBSCRIPTION
        ══════════════════════════════════════════════════════════════════ */}
        <GroupCard
          number={2}
          title="Subscription"
          color="emerald"
          subtitle="Context hooks, conditional renders, plan config, plan group & versions, checkout, cancel/resume."
        >
          {/* Context & data hooks */}
          <SectionCard
            title="Context & Data Hooks"
            subtitle="useSubscriptionContext · useSubscription · useSubscriptionManagement"
          >
            <div className="grid gap-3 md:grid-cols-3">
              {/* context */}
              <div className="rounded-lg border border-emerald-100 bg-white p-3 text-xs dark:border-emerald-900 dark:bg-gray-800">
                <p className="mb-2 font-bold text-emerald-700 dark:text-emerald-400">useSubscriptionContext</p>
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
              {/* useSubscription */}
              <div className="rounded-lg border border-emerald-100 bg-white p-3 text-xs dark:border-emerald-900 dark:bg-gray-800">
                <p className="mb-2 font-bold text-emerald-700 dark:text-emerald-400">useSubscription(workspaceId)</p>
                <Row label="Loading">
                  <StatusBadge value={!subLoading} trueLabel="Ready" falseLabel="Loading…" />
                </Row>
                {subError && <p className="text-xs text-red-600">{subError}</p>}
                <Row label="Status">
                  <span className="font-mono text-xs">{subscription?.subscription?.subscriptionStatus || "—"}</span>
                </Row>
                <Row label="Plan">
                  <span className="text-xs">{subscription?.plan?.name || "—"}</span>
                </Row>
                <button
                  onClick={() => refetchSub()}
                  className="mt-2 w-full rounded bg-emerald-600 py-1 text-xs text-white hover:bg-emerald-700"
                >
                  Refetch
                </button>
              </div>
              {/* management */}
              <div className="rounded-lg border border-emerald-100 bg-white p-3 text-xs dark:border-emerald-900 dark:bg-gray-800">
                <p className="mb-2 font-bold text-emerald-700 dark:text-emerald-400">useSubscriptionManagement</p>
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
                  className="mt-2 w-full rounded bg-emerald-600 py-1 text-xs text-white hover:bg-emerald-700"
                >
                  Refetch
                </button>
              </div>
            </div>
          </SectionCard>

          {/* Conditional renders */}
          <SectionCard
            title="Conditional Renders"
            subtitle="WhenSubscription · WhenNoSubscription · WhenSubscriptionToPlans"
          >
            <div className="grid gap-3 sm:grid-cols-3">
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
          </SectionCard>

          {/* Plan config */}
          <SectionCard
            title="Plan Configuration"
            subtitle="Features · Limits · Quotas from planVersion + workspace feature flags"
          >
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-purple-100 bg-white p-3 dark:border-purple-900 dark:bg-gray-800">
                <div className="mb-2 flex items-center gap-2">
                  <p className="text-xs font-bold text-purple-700 dark:text-purple-400">Features</p>
                  <TypePill type="feature" />
                </div>
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
              <div className="rounded-lg border border-indigo-100 bg-white p-3 dark:border-indigo-900 dark:bg-gray-800">
                <div className="mb-2 flex items-center gap-2">
                  <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400">Limits</p>
                  <TypePill type="limit" />
                </div>
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
              </div>
              <div className="rounded-lg border border-teal-100 bg-white p-3 dark:border-teal-900 dark:bg-gray-800">
                <div className="mb-2 flex items-center gap-2">
                  <p className="text-xs font-bold text-teal-700 dark:text-teal-400">Quotas</p>
                  <TypePill type="quota" />
                </div>
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
              </div>
            </div>
            {wsFeatureKeys.length > 0 && (
              <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-900/20">
                <p className="mb-1 text-xs font-bold text-amber-700 dark:text-amber-400">
                  Workspace feature flags (currentWorkspace.features)
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

          {/* Plan group & versions */}
          <SectionCard
            title="Plan Group & Versions"
            subtitle="usePlanGroup · usePlanGroupVersions — available plans for upgrade flow"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-emerald-100 bg-white p-3 text-xs dark:border-emerald-900 dark:bg-gray-800">
                <p className="mb-2 font-bold text-emerald-700 dark:text-emerald-400">usePlanGroup(workspaceId)</p>
                <button
                  onClick={() => refetchPlanGroup()}
                  disabled={planGroupLoading || !workspaceId}
                  className="mb-2 rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {planGroupLoading ? "Loading…" : "Fetch"}
                </button>
                {planGroupError && <p className="text-xs text-red-600">{planGroupError}</p>}
                {planGroupData ? (
                  <>
                    <Row label="Group name">
                      <span className="font-medium">{planGroupData.group?.name ?? "—"}</span>
                    </Row>
                    <Row label="Group version">
                      <span className="font-mono text-xs">{planGroupData.groupVersion?._id ?? "—"}</span>
                    </Row>
                    <Row label="Plans">
                      <span>{planGroupData.plans?.length ?? 0}</span>
                    </Row>
                  </>
                ) : (
                  !planGroupLoading && <p className="text-xs text-gray-400">Click to load.</p>
                )}
              </div>
              <div className="rounded-lg border border-emerald-100 bg-white p-3 text-xs dark:border-emerald-900 dark:bg-gray-800">
                <p className="mb-2 font-bold text-emerald-700 dark:text-emerald-400">
                  usePlanGroupVersions(workspaceId)
                </p>
                <button
                  onClick={() => refetchVersions()}
                  disabled={versionsLoading || !workspaceId}
                  className="mb-2 rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {versionsLoading ? "Loading…" : "Fetch"}
                </button>
                {versionsError && <p className="text-xs text-red-600">{versionsError}</p>}
                {planGroupVersions ? (
                  <>
                    <Row label="Group">
                      <span>{planGroupVersions.group?.name ?? "—"}</span>
                    </Row>
                    <Row label="Current version">
                      <span className="font-mono text-xs">{planGroupVersions.currentVersion?._id ?? "—"}</span>
                    </Row>
                    <Row label="Available upgrades">
                      <span>{planGroupVersions.availableVersions?.length ?? 0}</span>
                    </Row>
                    {(planGroupVersions.availableVersions ?? []).length > 0 && (
                      <div className="mt-2 space-y-1">
                        {(planGroupVersions.availableVersions as any[]).map((v: any) => (
                          <div key={v._id} className="flex items-center justify-between">
                            <span className="font-mono text-xs">{v._id}</span>
                            <button
                              onClick={() => setSelectedVersionId(v._id)}
                              className={`rounded px-1.5 py-0.5 text-xs ${selectedVersionId === v._id ? "bg-emerald-600 text-white" : "border border-emerald-300 text-emerald-600 hover:bg-emerald-50"}`}
                            >
                              Select
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  !versionsLoading && <p className="text-xs text-gray-400">Click to load.</p>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Checkout & change plan */}
          <SectionCard
            title="Checkout & Plan Change"
            subtitle="useCreateCheckoutSession · useUpdateSubscription — upgrade flows"
          >
            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Plan version ID <span className="text-gray-400">(select above or paste)</span>
              </label>
              <input
                type="text"
                value={selectedVersionId}
                onChange={e => setSelectedVersionId(e.target.value)}
                placeholder="Select from plan group versions above"
                className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-green-100 bg-white p-3 dark:border-green-900 dark:bg-gray-800">
                <p className="mb-1 text-xs font-bold text-green-700 dark:text-green-400">
                  useCreateCheckoutSession — new subscription
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (!selectedVersionId) return;
                      setCheckoutResult(null);
                      try {
                        const r = await createCheckoutSession({
                          planVersionId: selectedVersionId,
                          successUrl: window.location.href,
                          cancelUrl: window.location.href,
                        });
                        setCheckoutResult(r as unknown as Record<string, unknown>);
                      } catch (e) {
                        setCheckoutResult({ error: e instanceof Error ? e.message : String(e) });
                      }
                    }}
                    disabled={checkoutLoading || !workspaceId || !selectedVersionId}
                    className="flex-1 rounded bg-green-600 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {checkoutLoading ? "Creating…" : "Create Checkout Session"}
                  </button>
                  {checkoutResult && (
                    <button
                      onClick={() => setCheckoutResult(null)}
                      className="rounded border border-green-300 px-2 text-xs text-green-700 hover:bg-green-50"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {checkoutError && <p className="mt-1 text-xs text-red-600">{checkoutError}</p>}
                {checkoutResult && (
                  <pre className="mt-2 overflow-auto rounded bg-gray-50 p-2 text-xs dark:bg-gray-900">
                    {JSON.stringify(checkoutResult, null, 2)}
                  </pre>
                )}
              </div>
              <div className="rounded-lg border border-amber-100 bg-white p-3 dark:border-amber-900 dark:bg-gray-800">
                <p className="mb-1 text-xs font-bold text-amber-700 dark:text-amber-400">
                  useUpdateSubscription — change plan
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (!selectedVersionId) return;
                      setUpdateSubResult(null);
                      try {
                        const r = await updateSubscription(selectedVersionId, {
                          successUrl: window.location.href,
                          cancelUrl: window.location.href,
                        });
                        setUpdateSubResult(JSON.stringify(r, null, 2));
                      } catch (e) {
                        setUpdateSubResult(`Error: ${e instanceof Error ? e.message : String(e)}`);
                      }
                    }}
                    disabled={updateSubLoading || !workspaceId || !selectedVersionId}
                    className="flex-1 rounded bg-amber-600 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    {updateSubLoading ? "Updating…" : "Update Subscription"}
                  </button>
                  {updateSubResult && (
                    <button
                      onClick={() => setUpdateSubResult(null)}
                      className="rounded border border-amber-300 px-2 text-xs text-amber-700 hover:bg-amber-50"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {updateSubError && <p className="mt-1 text-xs text-red-600">{updateSubError}</p>}
                {updateSubResult && (
                  <pre className="mt-2 overflow-auto rounded bg-gray-50 p-2 text-xs dark:bg-gray-900">
                    {updateSubResult}
                  </pre>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Cancel / resume */}
          <SectionCard title="Cancel & Resume Subscription" subtitle="useCancelSubscription · useResumeSubscription">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={async () => {
                  if (!confirm("Cancel subscription at period end?")) return;
                  setCancelResult(null);
                  try {
                    await cancelSubscription();
                    setCancelResult("Scheduled for cancellation at period end.");
                  } catch (e) {
                    setCancelResult(`Error: ${e instanceof Error ? e.message : String(e)}`);
                  }
                }}
                disabled={cancelLoading || !workspaceId}
                className="rounded bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {cancelLoading ? "Canceling…" : "Cancel at Period End"}
              </button>
              <button
                onClick={async () => {
                  setResumeResult(null);
                  try {
                    await resumeSubscription();
                    setResumeResult("Subscription resumed.");
                  } catch (e) {
                    setResumeResult(`Error: ${e instanceof Error ? e.message : String(e)}`);
                  }
                }}
                disabled={resumeLoading || !workspaceId}
                className="rounded bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {resumeLoading ? "Resuming…" : "Resume Subscription"}
              </button>
            </div>
            {cancelError && <p className="mt-2 text-xs text-red-600">{cancelError}</p>}
            {resumeError && <p className="mt-2 text-xs text-red-600">{resumeError}</p>}
            {(cancelResult || resumeResult) && (
              <p className="mt-2 text-xs text-gray-700 dark:text-gray-300">{cancelResult || resumeResult}</p>
            )}
          </SectionCard>
        </GroupCard>

        {/* ══════════════════════════════════════════════════════════════════
            GROUP 3 · TRIAL
        ══════════════════════════════════════════════════════════════════ */}
        <GroupCard
          number={3}
          title="Trial"
          color="teal"
          subtitle="useTrialStatus · WhenTrialing · WhenNotTrialing · WhenTrialEnding"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-teal-100 bg-white p-3 text-xs dark:border-teal-900 dark:bg-gray-800">
              <p className="mb-2 font-bold text-teal-700 dark:text-teal-400">useTrialStatus()</p>
              <Row label="isTrialing">
                <StatusBadge value={isTrialing} />
              </Row>
              <Row label="isTrialEnding">
                <StatusBadge value={isTrialEnding} />
              </Row>
              <Row label="daysRemaining">
                <span className="font-mono">{daysRemaining ?? "—"}</span>
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
            <SubSection title="WhenTrialEnding ≤7 days" code="<WhenTrialEnding daysThreshold={7}>">
              <WhenTrialEnding
                daysThreshold={7}
                fallbackComponent={<ResultBox ok={true}>More than 7 days left</ResultBox>}
              >
                <ResultBox ok={false}>Ends in &lt;7 days!</ResultBox>
              </WhenTrialEnding>
            </SubSection>
          </div>
        </GroupCard>

        {/* ══════════════════════════════════════════════════════════════════
            GROUP 4 · FEATURE FLAGS & LIMITS
        ══════════════════════════════════════════════════════════════════ */}
        <GroupCard
          number={4}
          title="Feature Flags & Limits"
          color="purple"
          subtitle="WhenWorkspaceFeature* · WhenUserFeature* · useFeatureGate · FeatureGate · FeatureButton · useLimitCheck"
        >
          {/* Workspace & user feature HOCs */}
          <SectionCard
            title="Workspace & User Feature Conditionals"
            subtitle="WhenWorkspaceFeatureEnabled/Disabled · WhenUserFeatureEnabled/Disabled"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SubSection
                title={`WhenWorkspaceFeatureEnabled "${FEATURE_ANALYTICS}"`}
                code={`<WhenWorkspaceFeatureEnabled slug="${FEATURE_ANALYTICS}">`}
              >
                <WhenWorkspaceFeatureEnabled slug={FEATURE_ANALYTICS}>
                  <ResultBox ok={true}>analytics enabled on workspace</ResultBox>
                </WhenWorkspaceFeatureEnabled>
              </SubSection>
              <SubSection
                title="WhenWorkspaceFeatureDisabled (disabled slug)"
                code='<WhenWorkspaceFeatureDisabled slug="...">'
              >
                {disabledWsFeatures.length > 0 && disabledWsFeatures[0] ? (
                  <WhenWorkspaceFeatureDisabled slug={disabledWsFeatures[0]}>
                    <ResultBox ok={false}>"{disabledWsFeatures[0]}" is disabled</ResultBox>
                  </WhenWorkspaceFeatureDisabled>
                ) : (
                  <p className="text-xs text-gray-400">All workspace features enabled</p>
                )}
              </SubSection>
              <SubSection
                title={`WhenUserFeatureEnabled "${FEATURE_ANALYTICS}"`}
                code={`<WhenUserFeatureEnabled slug="${FEATURE_ANALYTICS}">`}
              >
                <WhenUserFeatureEnabled slug={FEATURE_ANALYTICS}>
                  <ResultBox ok={true}>User-level "{FEATURE_ANALYTICS}" enabled</ResultBox>
                </WhenUserFeatureEnabled>
              </SubSection>
              <SubSection
                title={`WhenUserFeatureDisabled "${FEATURE_ANALYTICS}"`}
                code={`<WhenUserFeatureDisabled slug="${FEATURE_ANALYTICS}">`}
              >
                <WhenUserFeatureDisabled slug={FEATURE_ANALYTICS}>
                  <ResultBox ok={false}>User-level "{FEATURE_ANALYTICS}" disabled</ResultBox>
                </WhenUserFeatureDisabled>
                <WhenUserFeatureEnabled slug={FEATURE_ANALYTICS}>
                  <ResultBox ok={true}>Feature enabled (WhenUserFeatureDisabled hidden)</ResultBox>
                </WhenUserFeatureEnabled>
              </SubSection>
            </div>
          </SectionCard>

          {/* useFeatureGate states */}
          <SectionCard title="useFeatureGate — Live Gate States" subtitle="Feature state for every real slug">
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
                  className="rounded-lg border border-gray-100 bg-white p-2 text-center dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="mb-1.5 flex items-center justify-center gap-1">
                    <code className="text-xs font-medium">{slug}</code>
                    <TypePill type={type} />
                  </div>
                  <GateBadge state={state} />
                </div>
              ))}
            </div>
          </SectionCard>

          {/* FeatureGate + FeatureButton */}
          <SectionCard
            title="FeatureGate & FeatureButton Components"
            subtitle="App-level gate components built on useFeatureGate"
          >
            <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <SubSection
                title={`analytics · ${stateAnalytics}`}
                code={`<FeatureGate featureSlug="${FEATURE_ANALYTICS}">`}
              >
                <FeatureGate
                  featureSlug={FEATURE_ANALYTICS}
                  fallback={<UpgradeFallback slug="analytics" />}
                  loadingFallback={<p className="text-xs text-gray-400">Loading…</p>}
                >
                  <ResultBox ok={true}>analytics ON</ResultBox>
                </FeatureGate>
              </SubSection>
              <SubSection
                title={`videos quota · ${stateVideos}`}
                code={`<FeatureGate featureSlug="${QUOTA_VIDEOS}" quotaSlug="${QUOTA_VIDEOS}">`}
              >
                <FeatureGate
                  featureSlug={QUOTA_VIDEOS}
                  quotaSlug={QUOTA_VIDEOS}
                  fallback={<UpgradeFallback slug="videos" />}
                  loadingFallback={<p className="text-xs text-gray-400">Loading…</p>}
                >
                  <ResultBox ok={true}>videos quota OK</ResultBox>
                </FeatureGate>
              </SubSection>
              <SubSection
                title={`enterprise-sso · ${stateNotInPlan}`}
                code={`<FeatureGate featureSlug="${NOT_IN_PLAN}">`}
              >
                <FeatureGate featureSlug={NOT_IN_PLAN} fallback={<UpgradeFallback slug="enterprise-sso" />}>
                  <ResultBox ok={true}>enterprise-sso accessible (unexpected)</ResultBox>
                </FeatureGate>
              </SubSection>
              <SubSection
                title={`max-test limit · ${stateMaxTest}`}
                code={`<FeatureGate featureSlug="${LIMIT_MAX_TEST}">`}
              >
                <FeatureGate
                  featureSlug={LIMIT_MAX_TEST}
                  fallback={<LimitFallback slug="max-test" reason="24 tests reached" />}
                  loadingFallback={<p className="text-xs text-gray-400">Loading…</p>}
                >
                  <ResultBox ok={true}>max-test under limit (cap: 24)</ResultBox>
                </FeatureGate>
              </SubSection>
              <SubSection
                title="analytics + additionalCondition=false"
                code={`<FeatureGate featureSlug="${FEATURE_ANALYTICS}" additionalCondition={false}>`}
              >
                <FeatureGate
                  featureSlug={FEATURE_ANALYTICS}
                  additionalCondition={false}
                  fallback={
                    <div className="rounded border-l-4 border-yellow-400 bg-yellow-50 p-3 text-sm dark:bg-yellow-900/20">
                      <p className="font-semibold text-yellow-800 dark:text-yellow-200">Role check failed (viewer)</p>
                    </div>
                  }
                >
                  <ResultBox ok={true}>Feature on + role check passed</ResultBox>
                </FeatureGate>
              </SubSection>
            </div>
            <div className="rounded-lg border border-purple-100 bg-white p-3 dark:border-purple-900 dark:bg-gray-800">
              <p className="mb-3 text-xs font-bold text-purple-700 dark:text-purple-400">
                FeatureButton — all gate states
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-gray-500">
                    OK <TypePill type="feature" />
                  </p>
                  <FeatureButton
                    featureSlug={FEATURE_ANALYTICS}
                    featureName="Analytics"
                    onExecute={() => alert("analytics executed")}
                    variant="default"
                    size="sm"
                  >
                    View Analytics
                  </FeatureButton>
                  <p className="text-xs text-gray-400">Executes immediately.</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-gray-500">
                    OK / EXHAUSTED <TypePill type="quota" />
                  </p>
                  <FeatureButton
                    featureSlug={QUOTA_VIDEOS}
                    quotaSlug={QUOTA_VIDEOS}
                    featureName="Videos"
                    onExecute={() => alert("videos executed")}
                    variant="default"
                    size="sm"
                  >
                    Upload Video
                  </FeatureButton>
                  <p className="text-xs text-gray-400">Zap icon if exhausted.</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-gray-500">NOT_INCLUDED</p>
                  <FeatureButton
                    featureSlug={NOT_IN_PLAN}
                    featureName="Enterprise SSO"
                    onExecute={() => {}}
                    variant="outline"
                    size="sm"
                    denialDescription="Enterprise SSO — available on Enterprise plans."
                  >
                    Configure SSO
                  </FeatureButton>
                  <p className="text-xs text-gray-400">Crown icon → upgrade dialog.</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-gray-500">NOT_PERMITTED</p>
                  <FeatureButton
                    featureSlug={FEATURE_ANALYTICS}
                    featureName="Analytics Export"
                    hasPermission={false}
                    onExecute={() => {}}
                    variant="outline"
                    size="sm"
                  >
                    Export Data
                  </FeatureButton>
                  <p className="text-xs text-gray-400">Lock icon — role blocked.</p>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* useLimitCheck */}
          <SectionCard
            title="useLimitCheck — Hard Cap Simulation"
            subtitle="isAtLimit(count) · remaining(count) — slide the count to test the limit"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  slug: LIMIT_MAX_TEST,
                  label: "max-test",
                  limit: limitMaxTest,
                  isAtLimit: isAtLimitTest,
                  remaining: remainingTest,
                  simCount: simulatedTestCount,
                  setSimCount: setSimulatedTestCount,
                },
                {
                  slug: LIMIT_MAX_USERS,
                  label: "max-users",
                  limit: limitMaxUsers,
                  isAtLimit: isAtLimitUsers,
                  remaining: remainingUsers,
                  simCount: simulatedUserCount,
                  setSimCount: setSimulatedUserCount,
                },
              ].map(({ slug, label, limit, isAtLimit, remaining, simCount, setSimCount }) => (
                <div
                  key={slug}
                  className="rounded-lg border border-purple-100 bg-white p-3 dark:border-purple-900 dark:bg-gray-800"
                >
                  <p className="mb-2 text-xs font-bold text-purple-700 dark:text-purple-400">
                    useLimitCheck("{label}")
                  </p>
                  <Row label="limit">
                    <span className="font-mono font-bold">{limit === null ? "∞" : limit}</span>
                  </Row>
                  <Row label="isAtLimit(count)">
                    <StatusBadge value={isAtLimit(simCount)} trueLabel="AT LIMIT" falseLabel="OK" />
                  </Row>
                  <Row label="remaining(count)">
                    <span className="font-mono">{remaining(simCount) === Infinity ? "∞" : remaining(simCount)}</span>
                  </Row>
                  {limit !== null && limit > 0 && (
                    <div className="my-2">
                      <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-600">
                        <div
                          className={`h-full rounded-full transition-all ${isAtLimit(simCount) ? "bg-red-500" : "bg-purple-500"}`}
                          style={{ width: `${Math.min(100, (simCount / limit) * 100)}%` }}
                        />
                      </div>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {simCount} / {limit}
                      </p>
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <label className="text-xs text-gray-500">Simulate count:</label>
                    <input
                      type="number"
                      min={0}
                      max={(limit ?? 50) + 5}
                      value={simCount}
                      onChange={e => setSimCount(Number(e.target.value))}
                      className="w-20 rounded border border-purple-200 bg-white px-2 py-0.5 text-sm dark:border-purple-700 dark:bg-gray-700"
                    />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </GroupCard>

        {/* ══════════════════════════════════════════════════════════════════
            GROUP 5 · QUOTA USAGE
        ══════════════════════════════════════════════════════════════════ */}
        <GroupCard
          number={5}
          title="Quota Usage"
          color="orange"
          subtitle="WhenQuota* conditionals · useQuotaUsageContext · server-proxy hooks (useServer*) · direct SDK hooks"
        >
          {/* WhenQuota* */}
          <SectionCard
            title="Quota Conditional Renders"
            subtitle="WhenQuotaAvailable · WhenQuotaExhausted · WhenQuotaOverage · WhenQuotaThreshold — read from QuotaUsageContextProvider"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SubSection title="WhenQuotaAvailable" code={`<WhenQuotaAvailable slug="${QUOTA_VIDEOS}">`}>
                <WhenQuotaAvailable
                  slug={QUOTA_VIDEOS}
                  fallbackComponent={<ResultBox ok={false}>Quota exhausted</ResultBox>}
                  loadingComponent={<p className="text-xs text-gray-400">Loading…</p>}
                >
                  <ResultBox ok={true}>Quota available</ResultBox>
                </WhenQuotaAvailable>
              </SubSection>
              <SubSection title="WhenQuotaExhausted" code={`<WhenQuotaExhausted slug="${QUOTA_VIDEOS}">`}>
                <WhenQuotaExhausted
                  slug={QUOTA_VIDEOS}
                  fallbackComponent={<ResultBox ok={true}>Not exhausted yet</ResultBox>}
                >
                  <ResultBox ok={false}>Quota exhausted</ResultBox>
                </WhenQuotaExhausted>
              </SubSection>
              <SubSection title="WhenQuotaOverage" code={`<WhenQuotaOverage slug="${QUOTA_VIDEOS}">`}>
                <WhenQuotaOverage slug={QUOTA_VIDEOS} fallbackComponent={<ResultBox ok={true}>No overage</ResultBox>}>
                  <ResultBox ok={false}>In overage</ResultBox>
                </WhenQuotaOverage>
              </SubSection>
              <SubSection
                title="WhenQuotaThreshold 50%"
                code={`<WhenQuotaThreshold slug="${QUOTA_VIDEOS}" threshold={50}>`}
              >
                <WhenQuotaThreshold
                  slug={QUOTA_VIDEOS}
                  threshold={50}
                  fallbackComponent={<ResultBox ok={true}>Below 50%</ResultBox>}
                >
                  <ResultBox ok={false}>Above 50% used</ResultBox>
                </WhenQuotaThreshold>
              </SubSection>
            </div>
          </SectionCard>

          {/* useQuotaUsageContext */}
          <SectionCard
            title="useQuotaUsageContext — Raw Context"
            subtitle="All quota statuses the context provider holds"
          >
            <div className="mb-3 flex items-center gap-3">
              <Row label="Loading">
                <StatusBadge value={ctxQuotasLoading} trueLabel="Yes" falseLabel="No" />
              </Row>
              <button
                onClick={() => refetchCtxQuotas()}
                disabled={ctxQuotasLoading}
                className="rounded bg-orange-600 px-3 py-1 text-xs font-medium text-white hover:bg-orange-700 disabled:opacity-50"
              >
                Refetch
              </button>
            </div>
            {ctxQuotasError && <p className="mb-2 text-xs text-red-600">{ctxQuotasError}</p>}
            {!ctxQuotas || Object.keys(ctxQuotas).length === 0 ? (
              <p className="text-xs text-gray-400">No quota data in context yet. Record some usage first.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {Object.entries(ctxQuotas).map(([slug, q]) => (
                  <div
                    key={slug}
                    className="rounded-lg border border-orange-100 bg-white p-2 text-xs dark:border-orange-900 dark:bg-gray-800"
                  >
                    <p className="mb-1 font-mono font-semibold text-orange-700 dark:text-orange-300">{slug}</p>
                    <Row label="consumed / included">
                      <span>
                        {q.consumed} / {q.included}
                      </span>
                    </Row>
                    <Row label="available">
                      <span className={q.available <= 0 ? "font-bold text-red-600" : "text-green-600"}>
                        {q.available}
                      </span>
                    </Row>
                    <Row label="overage">
                      <StatusBadge value={q.hasOverage} />
                    </Row>
                    {q.included > 0 && (
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-full rounded-full ${q.available <= 0 ? "bg-red-500" : "bg-orange-500"}`}
                          style={{ width: `${Math.min(100, (q.consumed / q.included) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Server proxy hooks */}
          <SectionCard
            title="Server-Proxy Quota Hooks (useServer*)"
            subtitle="Calls your app's /api/saas/usage/* routes — session-safe, HttpOnly cookie. Use these in production."
          >
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {/* record */}
              <div className="rounded-lg border border-orange-100 bg-white p-3 text-xs dark:border-orange-900 dark:bg-gray-800">
                <p className="mb-1 font-bold text-orange-700 dark:text-orange-400">useServerRecordUsage</p>
                <p className="mb-2 text-gray-400">POST /api/saas/usage/record</p>
                <input
                  type="number"
                  min={1}
                  value={recordQty}
                  onChange={e => setRecordQty(Number(e.target.value))}
                  className="mb-2 w-full rounded border border-orange-200 bg-white px-2 py-1 text-sm dark:border-orange-700 dark:bg-gray-700"
                />
                <div className="flex gap-1">
                  <button
                    onClick={() =>
                      workspaceId &&
                      record({ workspaceId, quotaSlug: QUOTA_VIDEOS, quantity: recordQty, source: "test-page" })
                    }
                    disabled={recLoading || !workspaceId}
                    className="flex-1 rounded bg-orange-600 py-1 text-xs font-medium text-white hover:bg-orange-700 disabled:opacity-50"
                  >
                    {recLoading ? "…" : "Record"}
                  </button>
                  {recData && (
                    <button
                      onClick={resetRec}
                      className="rounded border border-orange-300 px-1.5 text-xs text-orange-700 hover:bg-orange-50"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {recError && <p className="mt-1 text-red-600">{recError}</p>}
                {recData && (
                  <pre
                    className={`mt-1 overflow-auto rounded p-1.5 text-xs ${recData.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}
                  >
                    {JSON.stringify(recData, null, 2)}
                  </pre>
                )}
              </div>
              {/* status */}
              <div className="rounded-lg border border-orange-100 bg-white p-3 text-xs dark:border-orange-900 dark:bg-gray-800">
                <p className="mb-1 font-bold text-orange-700 dark:text-orange-400">useServerQuotaStatus</p>
                <p className="mb-2 text-gray-400">GET /api/saas/usage/status</p>
                <button
                  onClick={refetchStatus}
                  disabled={statusLoading || !workspaceId}
                  className="w-full rounded bg-orange-600 py-1 text-xs font-medium text-white hover:bg-orange-700 disabled:opacity-50"
                >
                  {statusLoading ? "…" : "Fetch"}
                </button>
                {statusError && <p className="mt-1 text-red-600">{statusError}</p>}
                {quotaStatus && (
                  <div className="mt-2 space-y-0.5">
                    <Row label="consumed">
                      <span>{quotaStatus.consumed}</span>
                    </Row>
                    <Row label="included">
                      <span>{quotaStatus.included}</span>
                    </Row>
                    <Row label="available">
                      <span className={quotaStatus.available <= 0 ? "font-bold text-red-600" : ""}>
                        {quotaStatus.available}
                      </span>
                    </Row>
                    {quotaStatus.included > 0 && (
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-full rounded-full ${quotaStatus.available <= 0 ? "bg-red-500" : "bg-orange-500"}`}
                          style={{ width: `${Math.min(100, (quotaStatus.consumed / quotaStatus.included) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* all quotas */}
              <div className="rounded-lg border border-orange-100 bg-white p-3 text-xs dark:border-orange-900 dark:bg-gray-800">
                <p className="mb-1 font-bold text-orange-700 dark:text-orange-400">useServerAllQuotas</p>
                <p className="mb-2 text-gray-400">GET /api/saas/usage/all</p>
                <button
                  onClick={refetchAll}
                  disabled={allLoading || !workspaceId}
                  className="w-full rounded bg-orange-600 py-1 text-xs font-medium text-white hover:bg-orange-700 disabled:opacity-50"
                >
                  {allLoading ? "…" : "Fetch All"}
                </button>
                {allError && <p className="mt-1 text-red-600">{allError}</p>}
                {allQuotas && (
                  <div className="mt-2 space-y-1">
                    {Object.keys(allQuotas).length === 0 ? (
                      <p className="text-gray-400">No quotas yet.</p>
                    ) : (
                      Object.entries(allQuotas).map(([slug, q]) => (
                        <div key={slug} className="rounded bg-gray-50 p-1 dark:bg-gray-900">
                          <span className="font-mono font-semibold">{slug}</span>
                          <span className="ml-1 text-gray-500">
                            {q.consumed}/{q.included}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              {/* usage logs */}
              <div className="rounded-lg border border-orange-100 bg-white p-3 text-xs dark:border-orange-900 dark:bg-gray-800">
                <p className="mb-1 font-bold text-orange-700 dark:text-orange-400">useServerUsageLogs</p>
                <p className="mb-2 text-gray-400">GET /api/saas/usage/logs</p>
                <button
                  onClick={refetchLogs}
                  disabled={logsLoading || !workspaceId}
                  className="w-full rounded bg-orange-600 py-1 text-xs font-medium text-white hover:bg-orange-700 disabled:opacity-50"
                >
                  {logsLoading ? "…" : "Fetch Logs"}
                </button>
                {logsError && <p className="mt-1 text-red-600">{logsError}</p>}
                {usageLogs.length > 0 && (
                  <table className="mt-2 w-full text-xs">
                    <thead>
                      <tr className="border-b text-gray-500">
                        <th className="pb-1 pr-2 text-left">Qty</th>
                        <th className="pb-1 pr-2 text-left">Source</th>
                        <th className="pb-1 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usageLogs.map(l => (
                        <tr key={l._id} className="border-b border-gray-50 dark:border-gray-700">
                          <td className="py-0.5 pr-2">{l.quantity}</td>
                          <td className="py-0.5 pr-2 text-gray-400">{l.source ?? "—"}</td>
                          <td className="py-0.5 text-gray-400">{new Date(l.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {usageLogs.length > 0 && (
                  <p className="mt-1 text-gray-400">
                    p{logsPage}/{logsTotalPages} · {logsTotalDocs} total{logsHasNextPage ? " +" : ""}
                  </p>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Direct SDK hooks */}
          <SectionCard
            title="Direct SDK Quota Hooks (no proxy)"
            subtitle="useRecordUsage · useQuotaUsageStatus · useAllQuotaUsage · useUsageLogs — call Buildbase directly from browser. Compare with server-proxy hooks above."
          >
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {/* direct record */}
              <div className="rounded-lg border border-yellow-100 bg-white p-3 text-xs dark:border-yellow-900 dark:bg-gray-800">
                <p className="mb-1 font-bold text-yellow-700 dark:text-yellow-400">useRecordUsage (direct)</p>
                <input
                  type="number"
                  min={1}
                  value={recDirectQty}
                  onChange={e => setRecDirectQty(Number(e.target.value))}
                  className="mb-2 w-full rounded border border-yellow-200 bg-white px-2 py-1 text-sm dark:border-yellow-700 dark:bg-gray-700"
                />
                <div className="flex gap-1">
                  <button
                    onClick={async () => {
                      setRecDirectResult(null);
                      const r = await recordUsageDirect({
                        quotaSlug: QUOTA_VIDEOS,
                        quantity: recDirectQty,
                        source: "test-direct",
                      });
                      setRecDirectResult(r as unknown as Record<string, unknown>);
                    }}
                    disabled={recDirectLoading || !workspaceId}
                    className="flex-1 rounded bg-yellow-600 py-1 text-xs font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
                  >
                    {recDirectLoading ? "…" : "Record"}
                  </button>
                  {recDirectResult && (
                    <button
                      onClick={() => setRecDirectResult(null)}
                      className="rounded border border-yellow-300 px-1.5 text-xs text-yellow-700 hover:bg-yellow-50"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {recDirectError && <p className="mt-1 text-red-600">{recDirectError}</p>}
                {recDirectResult && (
                  <pre className="mt-1 overflow-auto rounded bg-green-50 p-1.5 text-xs text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    {JSON.stringify(recDirectResult, null, 2)}
                  </pre>
                )}
              </div>
              {/* direct status */}
              <div className="rounded-lg border border-yellow-100 bg-white p-3 text-xs dark:border-yellow-900 dark:bg-gray-800">
                <p className="mb-1 font-bold text-yellow-700 dark:text-yellow-400">useQuotaUsageStatus (direct)</p>
                <button
                  onClick={() => refetchDirectStatus()}
                  disabled={directStatusLoading || !workspaceId}
                  className="w-full rounded bg-yellow-600 py-1 text-xs font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
                >
                  {directStatusLoading ? "…" : "Fetch"}
                </button>
                {directStatusError && <p className="mt-1 text-red-600">{directStatusError}</p>}
                {directQuotaStatus && (
                  <div className="mt-2 space-y-0.5">
                    <Row label="consumed">
                      <span>{(directQuotaStatus as any).consumed ?? "—"}</span>
                    </Row>
                    <Row label="included">
                      <span>{(directQuotaStatus as any).included ?? "—"}</span>
                    </Row>
                    <Row label="available">
                      <span>{(directQuotaStatus as any).available ?? "—"}</span>
                    </Row>
                  </div>
                )}
              </div>
              {/* direct all */}
              <div className="rounded-lg border border-yellow-100 bg-white p-3 text-xs dark:border-yellow-900 dark:bg-gray-800">
                <p className="mb-1 font-bold text-yellow-700 dark:text-yellow-400">useAllQuotaUsage (direct)</p>
                <button
                  onClick={() => refetchDirectAll()}
                  disabled={directAllLoading || !workspaceId}
                  className="w-full rounded bg-yellow-600 py-1 text-xs font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
                >
                  {directAllLoading ? "…" : "Fetch All"}
                </button>
                {directAllError && <p className="mt-1 text-red-600">{directAllError}</p>}
                {directAllQuotas && (
                  <div className="mt-2 space-y-1">
                    {Object.keys(directAllQuotas).length === 0 ? (
                      <p className="text-gray-400">No quotas yet.</p>
                    ) : (
                      Object.entries(directAllQuotas).map(([slug, q]) => (
                        <div key={slug} className="rounded bg-gray-50 p-1 dark:bg-gray-900">
                          <span className="font-mono font-semibold">{slug}</span>
                          <span className="ml-1 text-gray-500">
                            {q.consumed}/{q.included}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              {/* direct logs */}
              <div className="rounded-lg border border-yellow-100 bg-white p-3 text-xs dark:border-yellow-900 dark:bg-gray-800">
                <p className="mb-1 font-bold text-yellow-700 dark:text-yellow-400">useUsageLogs (direct)</p>
                {directLogsLoading && <p className="text-gray-400">Loading…</p>}
                {directLogsError && <p className="text-red-600">{directLogsError}</p>}
                {!directLogsLoading && directLogs.length === 0 && <p className="text-gray-400">No logs yet.</p>}
                {directLogs.length > 0 && (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-gray-500">
                        <th className="pb-1 pr-2 text-left">Qty</th>
                        <th className="pb-1 pr-2 text-left">Src</th>
                        <th className="pb-1 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {directLogs.map(l => (
                        <tr key={l._id} className="border-b border-gray-50 dark:border-gray-700">
                          <td className="py-0.5 pr-2">{l.quantity}</td>
                          <td className="py-0.5 pr-2 text-gray-400">{l.source ?? "—"}</td>
                          <td className="py-0.5 text-gray-400">{new Date(l.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {directLogs.length > 0 && (
                  <p className="mt-1 text-gray-400">
                    p{directLogsPage}/{directLogsTotalPages} · {directLogsTotalDocs}
                    {directLogsHasNext ? " +" : ""}
                  </p>
                )}
              </div>
            </div>
          </SectionCard>
        </GroupCard>

        {/* ══════════════════════════════════════════════════════════════════
            GROUP 6 · BILLING & SEATS
        ══════════════════════════════════════════════════════════════════ */}
        <GroupCard
          number={6}
          title="Billing & Seats"
          color="slate"
          subtitle="useInvoices · useInvoice · useBillingPortal · useSeatStatus"
        >
          <div className="grid gap-4 md:grid-cols-2">
            {/* Invoices */}
            <SectionCard title="Invoices" subtitle="useInvoices(workspaceId, 5) · useInvoice(workspaceId, invoiceId)">
              <div className="mb-3 flex items-center gap-2">
                <button
                  onClick={() => refetchInvoices()}
                  disabled={invoicesLoading || !workspaceId}
                  className="rounded bg-slate-600 px-3 py-1 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                >
                  {invoicesLoading ? "Loading…" : "Fetch Last 5"}
                </button>
                {invoicesHasMore && <span className="text-xs text-slate-500">+ more</span>}
              </div>
              {invoicesError && <p className="mb-2 text-xs text-red-600">{invoicesError}</p>}
              {invoices.length === 0 && !invoicesLoading && (
                <p className="mb-2 text-xs text-gray-400">No invoices found.</p>
              )}
              {invoices.length > 0 && (
                <table className="mb-3 w-full text-xs">
                  <thead>
                    <tr className="border-b text-gray-500 dark:border-gray-700">
                      <th className="pb-1 pr-3 text-left">Date</th>
                      <th className="pb-1 pr-3 text-left">Amount</th>
                      <th className="pb-1 pr-3 text-left">Status</th>
                      <th className="pb-1 text-left">ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(inv => (
                      <tr key={inv.id} className="border-b border-gray-50 dark:border-gray-700">
                        <td className="py-1 pr-3 text-gray-500">
                          {inv.created ? new Date(inv.created * 1000).toLocaleDateString() : "—"}
                        </td>
                        <td className="py-1 pr-3 font-medium">
                          {inv.currency?.toUpperCase()} {((inv.amount_paid ?? inv.amount_due ?? 0) / 100).toFixed(2)}
                        </td>
                        <td className="py-1 pr-3">
                          <span
                            className={`rounded px-1.5 py-0.5 text-xs font-medium ${inv.status === "paid" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-1">
                          <button
                            onClick={() => {
                              setInvoiceId(inv.id);
                              setQueriedInvoiceId(inv.id);
                            }}
                            className="font-mono text-xs text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
                          >
                            {inv.id.slice(0, 12)}…
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="border-t pt-3 dark:border-gray-700">
                <p className="mb-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  useInvoice — single lookup
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={invoiceId}
                    onChange={e => setInvoiceId(e.target.value)}
                    placeholder="in_1abc… (click ID above)"
                    className="flex-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                  <button
                    onClick={() => setQueriedInvoiceId(invoiceId.trim() || null)}
                    disabled={!invoiceId.trim() || !workspaceId}
                    className="rounded bg-slate-600 px-2 py-1 text-xs text-white hover:bg-slate-700 disabled:opacity-50"
                  >
                    Fetch
                  </button>
                  {queriedInvoiceId && (
                    <button
                      onClick={() => {
                        setQueriedInvoiceId(null);
                        setInvoiceId("");
                      }}
                      className="rounded border border-slate-300 px-2 text-xs text-slate-600 hover:bg-slate-50 dark:text-slate-300"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {singleInvoiceLoading && <p className="mt-1 text-xs text-slate-500">Loading…</p>}
                {singleInvoiceError && <p className="mt-1 text-xs text-red-600">{singleInvoiceError}</p>}
                {singleInvoice && (
                  <div className="mt-2 space-y-0.5 rounded bg-slate-50 p-2 text-xs dark:bg-gray-900">
                    <Row label="Number">
                      <span className="font-mono">{singleInvoice.number ?? "—"}</span>
                    </Row>
                    <Row label="Status">
                      <span
                        className={`rounded px-1.5 font-medium ${singleInvoice.status === "paid" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                      >
                        {singleInvoice.status}
                      </span>
                    </Row>
                    <Row label="Paid">
                      <span>
                        {singleInvoice.currency?.toUpperCase()} {(singleInvoice.amount_paid / 100).toFixed(2)}
                      </span>
                    </Row>
                    <Row label="Created">
                      <span className="text-gray-500">{new Date(singleInvoice.created * 1000).toLocaleString()}</span>
                    </Row>
                    {singleInvoice.hosted_invoice_url && (
                      <a
                        href={singleInvoice.hosted_invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
                      >
                        View invoice ↗
                      </a>
                    )}
                  </div>
                )}
              </div>
            </SectionCard>

            <div className="space-y-4">
              {/* Billing portal */}
              <SectionCard
                title="Billing Portal"
                subtitle="useBillingPortal — opens Stripe customer portal for payment methods & invoices"
              >
                <button
                  onClick={() => openBillingPortal(window.location.href)}
                  disabled={billingPortalLoading || !workspaceId}
                  className="rounded bg-slate-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                >
                  {billingPortalLoading ? "Opening…" : "Open Billing Portal"}
                </button>
                {billingPortalError && <p className="mt-2 text-xs text-red-600">{billingPortalError}</p>}
              </SectionCard>

              {/* Seat status */}
              <SectionCard title="Seat Status" subtitle="useSeatStatus(currentWorkspace) — seat-based billing info">
                <div className="rounded-lg border border-slate-100 bg-white p-3 text-xs dark:border-slate-700 dark:bg-gray-800">
                  <Row label="hasSeatPricing">
                    <StatusBadge value={seatStatus.hasSeatPricing} />
                  </Row>
                  <Row label="memberCount">
                    <span className="font-mono">{seatStatus.memberCount}</span>
                  </Row>
                  <Row label="includedSeats">
                    <span className="font-mono">{seatStatus.includedSeats}</span>
                  </Row>
                  <Row label="maxUsers">
                    <span className="font-mono">{seatStatus.maxUsers === 0 ? "∞" : seatStatus.maxUsers}</span>
                  </Row>
                  <Row label="canInvite">
                    <StatusBadge value={seatStatus.canInvite} />
                  </Row>
                  <Row label="inviteBlockReason">
                    <span className="font-mono text-xs text-gray-500">{seatStatus.inviteBlockReason ?? "none"}</span>
                  </Row>
                </div>
                {seatStatus.hasSeatPricing && seatStatus.maxUsers > 0 && (
                  <div className="mt-2">
                    <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-600">
                      <div
                        className={`h-full rounded-full ${seatStatus.memberCount >= seatStatus.maxUsers ? "bg-red-500" : "bg-slate-500"}`}
                        style={{ width: `${Math.min(100, (seatStatus.memberCount / seatStatus.maxUsers) * 100)}%` }}
                      />
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {seatStatus.memberCount} / {seatStatus.maxUsers} seats
                    </p>
                  </div>
                )}
              </SectionCard>
            </div>
          </div>
        </GroupCard>

        {/* ══════════════════════════════════════════════════════════════════
            GROUP 7 · NOTIFICATIONS
        ══════════════════════════════════════════════════════════════════ */}
        <GroupCard
          number={7}
          title="Notifications"
          color="rose"
          subtitle="usePushNotifications — browser push subscription · POST /api/saas/notification/send — server-side send via Buildbase"
        >
          <div className="grid gap-4 md:grid-cols-2">
            {/* Push subscription */}
            <SectionCard
              title="Push Subscription"
              subtitle="usePushNotifications() — browser push permission & subscribe/unsubscribe"
            >
              <div className="mb-3 rounded-lg border border-rose-100 bg-white p-3 text-xs dark:border-rose-900 dark:bg-gray-800">
                <Row label="Supported">
                  <StatusBadge value={isSupported} />
                </Row>
                <Row label="Permission">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-semibold ${permission === "granted" ? "bg-green-100 text-green-800" : permission === "denied" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}
                  >
                    {permission ?? "default"}
                  </span>
                </Row>
                <Row label="Subscribed">
                  <StatusBadge value={isSubscribed} />
                </Row>
              </div>
              {pushError && <p className="mb-2 text-xs text-red-600">{String(pushError)}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => subscribe()}
                  disabled={pushLoading || !isSupported || isSubscribed}
                  className="flex-1 rounded bg-rose-600 py-1.5 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  Subscribe
                </button>
                <button
                  onClick={() => unsubscribe()}
                  disabled={pushLoading || !isSubscribed}
                  className="flex-1 rounded border border-rose-300 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-600 dark:text-rose-300"
                >
                  Unsubscribe
                </button>
              </div>
              {!isSupported && (
                <p className="mt-2 text-xs text-amber-600">Push notifications not supported in this browser.</p>
              )}
            </SectionCard>

            {/* Send notification */}
            <SectionCard
              title="Send Notification"
              subtitle="POST /api/saas/notification/send — server-side proxy to Buildbase notification.send()"
            >
              <div className="space-y-2">
                {[
                  {
                    label: "Event slug *",
                    val: notifEventSlug,
                    set: setNotifEventSlug,
                    placeholder: "test-notification",
                  },
                  {
                    label: "User ID (optional)",
                    val: notifUserId,
                    set: setNotifUserId,
                    placeholder: "leave blank = all workspace users",
                  },
                  { label: "Title", val: notifTitle, set: setNotifTitle, placeholder: "Notification title" },
                  { label: "Message", val: notifMessage, set: setNotifMessage, placeholder: "Notification body" },
                  { label: "URL (optional)", val: notifUrl, set: setNotifUrl, placeholder: "https://…" },
                ].map(({ label, val, set, placeholder }) => (
                  <div key={label}>
                    <label className="mb-0.5 block text-xs font-medium text-gray-700 dark:text-gray-300">{label}</label>
                    <input
                      type="text"
                      value={val}
                      onChange={e => set(e.target.value)}
                      placeholder={placeholder}
                      className="w-full rounded border border-rose-200 bg-white px-2 py-1 text-sm dark:border-rose-700 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleSendNotification}
                  disabled={sendLoading || !workspaceId || !notifEventSlug}
                  className="flex-1 rounded bg-rose-600 py-1.5 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {sendLoading ? "Sending…" : "Send Notification"}
                </button>
                {(sendResult || sendError) && (
                  <button
                    onClick={() => {
                      setSendResult(null);
                      setSendError(null);
                    }}
                    className="rounded border border-rose-300 px-2 text-xs text-rose-700 hover:bg-rose-50 dark:text-rose-300"
                  >
                    Clear
                  </button>
                )}
              </div>
              {sendError && <p className="mt-2 text-xs text-red-600">{sendError}</p>}
              {sendResult && (
                <pre
                  className={`mt-2 overflow-auto rounded p-2 text-xs ${(sendResult as any).success ? "bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"}`}
                >
                  {JSON.stringify(sendResult, null, 2)}
                </pre>
              )}
            </SectionCard>
          </div>
        </GroupCard>

        {/* ══════════════════════════════════════════════════════════════════
            GROUP 8 · UTILITY FUNCTIONS (ESM gap reference)
        ══════════════════════════════════════════════════════════════════ */}
        <GroupCard
          number={8}
          title="Utility Functions"
          color="amber"
          subtitle="Pure helper functions exported from @buildbase/sdk/react types but absent from the ESM bundle in v0.0.36 — importing them causes a build error."
        >
          <div className="rounded-lg border border-dashed border-amber-400 bg-amber-50 p-4 dark:border-amber-600 dark:bg-amber-900/20">
            <div className="grid gap-4 text-xs sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Quota Formatting",
                  fns: [
                    "formatCents(cents, currency?)",
                    "formatOverageRate(quota, currency?)",
                    "formatOverageRateWithLabel(quota)",
                    "formatQuotaIncludedOverage(quota)",
                    "formatQuotaWithPrice(quota, opts?)",
                    "getQuotaDisplayValue(quota)",
                    "getQuotaDisplayWithVariant(quota)",
                    "getQuotaUnitLabelFromName(name)",
                    "getQuotaOverageCents(quota, interval)",
                  ],
                },
                {
                  title: "Seat Pricing",
                  fns: [
                    "calculateBillableSeats(ws, plan)",
                    "calculateSeatOverageCents(count, plan)",
                    "calculateTotalSubscriptionCents(...)",
                    "getPerSeatPriceCents(plan, interval)",
                    "getSeatPricing(plan, interval)",
                  ],
                },
                {
                  title: "Plan & Currency",
                  fns: [
                    "getPricingVariant(plan, interval)",
                    "getBasePriceCents(plan, interval)",
                    "getStripePriceIdForInterval(plan, i)",
                    "getAvailableCurrenciesFromPlans(plans)",
                    "getDisplayCurrency(plans, locale)",
                    "getBillingIntervalAndCurrencyFromPriceId(id, plan)",
                    "getCurrencySymbol(code)",
                    "getCurrencyFlag(code)",
                  ],
                },
              ].map(({ title, fns }) => (
                <div key={title}>
                  <p className="mb-2 font-semibold text-amber-800 dark:text-amber-300">{title}</p>
                  <ul className="space-y-0.5 font-mono text-amber-700 dark:text-amber-400">
                    {fns.map(f => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-amber-600 dark:text-amber-400">
              Workaround: import from the CJS build in a server component or API route. Will be available in a future
              SDK release when the ESM bundle is updated.
            </p>
          </div>
        </GroupCard>

        {/* ══════════════════════════════════════════════════════════════════
            GROUP 9 · WORKSPACE UI & PERMISSIONS
        ══════════════════════════════════════════════════════════════════ */}
        <GroupCard
          number={9}
          title="Workspace UI & Permissions"
          color="blue"
          subtitle="WorkspaceSwitcher · WhenPermission · usePermissions · SETTINGS_SCREENS"
        >
          <SectionCard title="WorkspaceSwitcher" subtitle="Render prop component for workspace switching UI">
            <div className="rounded-lg border border-blue-100 bg-white p-4 dark:border-blue-900 dark:bg-gray-800">
              <p className="mb-3 text-xs text-gray-500">
                Render prop receives{" "}
                <code className="rounded bg-gray-100 px-1 font-mono text-xs dark:bg-gray-700">isLoading</code> and{" "}
                <code className="rounded bg-gray-100 px-1 font-mono text-xs dark:bg-gray-700">currentWorkspace</code>:
              </p>
              <WorkspaceSwitcher
                trigger={(isLoading, currentWs) => (
                  <div className="flex cursor-pointer items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm dark:border-blue-800 dark:bg-blue-900/30">
                    {isLoading ? (
                      <span className="text-xs text-blue-600">Loading…</span>
                    ) : currentWs ? (
                      <>
                        <span className="flex h-6 w-6 items-center justify-center rounded bg-blue-600 text-xs font-bold text-white">
                          {currentWs.name?.[0]?.toUpperCase() ?? "W"}
                        </span>
                        <span className="font-medium text-blue-800 dark:text-blue-200">{currentWs.name}</span>
                      </>
                    ) : (
                      <span className="text-xs text-blue-600">Choose workspace…</span>
                    )}
                  </div>
                )}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="usePermissions"
            subtitle="usePermissions() — resolves all permissions for the current user"
          >
            <div className="rounded-lg border border-blue-100 bg-white p-3 text-xs dark:border-blue-900 dark:bg-gray-800">
              <p className="mb-2 font-semibold text-blue-700 dark:text-blue-400">Resolved permissions:</p>
              <Row label="isOwner">
                <StatusBadge value={permIsOwner} />
              </Row>
              <Row label="role">
                <span className="font-mono">{permRole ?? "—"}</span>
              </Row>
              <Row label="permissions count">
                <span className="font-mono">{userPermissions.size}</span>
              </Row>
              <Row label='can("read")'>
                <StatusBadge value={canPermission("read")} />
              </Row>
              <Row label='can("write")'>
                <StatusBadge value={canPermission("write")} />
              </Row>
            </div>
          </SectionCard>

          <SectionCard
            title="WhenPermission"
            subtitle="<WhenPermission permission='...'> — renders children only when user has the permission"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <SubSection title="WhenPermission — 'read'" code="<WhenPermission permission='read'>">
                <WhenPermission
                  permission="read"
                  fallback={<ResultBox ok={false}>No &apos;read&apos; permission</ResultBox>}
                >
                  <ResultBox ok={true}>&apos;read&apos; permission granted</ResultBox>
                </WhenPermission>
              </SubSection>
              <SubSection title="WhenPermission — 'write'" code="<WhenPermission permission='write'>">
                <WhenPermission
                  permission="write"
                  fallback={<ResultBox ok={false}>No &apos;write&apos; permission</ResultBox>}
                >
                  <ResultBox ok={true}>&apos;write&apos; permission granted</ResultBox>
                </WhenPermission>
              </SubSection>
            </div>
          </SectionCard>

          <SectionCard
            title="SETTINGS_SCREENS constant"
            subtitle="Named settings screen identifiers (Set of valid section values)"
          >
            <div className="flex flex-wrap gap-2">
              {Array.from(SETTINGS_SCREENS).map(val => (
                <div
                  key={val}
                  className="rounded border border-blue-100 bg-white px-2 py-1 dark:border-blue-900 dark:bg-gray-800"
                >
                  <span className="font-mono text-xs text-blue-700 dark:text-blue-300">{String(val)}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </GroupCard>

        {/* ══════════════════════════════════════════════════════════════════
            GROUP 10 · INTERNATIONALIZATION (i18n)
        ══════════════════════════════════════════════════════════════════ */}
        <GroupCard
          number={10}
          title="Internationalization (i18n)"
          color="teal"
          subtitle="useTranslation · SUPPORTED_LOCALES — 8 locales, ICU MessageFormat, RTL support, native numerals."
        >
          <SectionCard title="useTranslation Hook" subtitle="Locale-aware translation, number, and currency formatting">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-teal-100 bg-white p-3 text-xs dark:border-teal-900 dark:bg-gray-800">
                <p className="mb-2 font-bold text-teal-700 dark:text-teal-400">Current locale state</p>
                <Row label="locale">
                  <span className="font-mono">{locale ?? "—"}</span>
                </Row>
                <Row label="dir (text direction)">
                  <span className="font-mono">{dir ?? "—"}</span>
                </Row>
                <Row label="fmtNum(1234)">
                  <span className="font-mono">{fmtNum(1234)}</span>
                </Row>
                <Row label='fmtCents(1999, "usd")'>
                  <span className="font-mono">{fmtCents(1999, "usd")}</span>
                </Row>
              </div>
              <div className="rounded-lg border border-teal-100 bg-white p-3 text-xs dark:border-teal-900 dark:bg-gray-800">
                <p className="mb-2 font-bold text-teal-700 dark:text-teal-400">Translation keys (t())</p>
                <Row label='t("subscription.currentPlan")'>
                  <span className="font-mono text-xs">{String(t("subscription.currentPlan" as any))}</span>
                </Row>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="SUPPORTED_LOCALES" subtitle="All locale codes supported by the SDK">
            <div className="flex flex-wrap gap-2">
              {SUPPORTED_LOCALES.map(loc => (
                <span
                  key={String(loc)}
                  className={`rounded border px-2 py-1 font-mono text-xs ${String(loc) === locale ? "border-teal-400 bg-teal-100 font-bold text-teal-800 dark:bg-teal-900 dark:text-teal-200" : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"}`}
                >
                  {String(loc)}
                </span>
              ))}
            </div>
          </SectionCard>
        </GroupCard>

        {/* ══════════════════════════════════════════════════════════════════
            GROUP 11 · PUBLIC PRICING & BETA FORM
        ══════════════════════════════════════════════════════════════════ */}
        <GroupCard
          number={11}
          title="Public Pricing & Beta Form"
          color="purple"
          subtitle="usePublicPlans · PricingPage · usePublicPlanGroupVersion · BetaForm — no login required."
        >
          <SectionCard
            title="usePublicPlans + PricingPage"
            subtitle="Fetch public plan groups by slug (for marketing/pricing pages)"
          >
            <div className="mb-3 flex items-center gap-2">
              <input
                value={publicPlanSlug}
                onChange={e => setPublicPlanSlug(e.target.value)}
                className="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="Plan group slug (e.g. main-pricing)"
              />
              <button
                onClick={() => setQueriedPublicSlug(publicPlanSlug)}
                className="rounded bg-purple-600 px-3 py-1 text-xs font-medium text-white hover:bg-purple-700"
              >
                Fetch Plans
              </button>
            </div>
            {publicPlansError && <p className="mb-2 text-xs text-red-600">{String(publicPlansError)}</p>}
            {publicPlansLoading && <p className="text-xs text-gray-400">Loading…</p>}
            {queriedPublicSlug && !publicPlansLoading && (
              <div className="rounded-lg border border-purple-100 bg-white p-3 text-xs dark:border-purple-900 dark:bg-gray-800">
                <p className="mb-2 font-semibold text-purple-700 dark:text-purple-400">
                  usePublicPlans(&quot;{queriedPublicSlug}&quot;)
                </p>
                <Row label="Plans count">
                  <span className="font-mono">{publicPlans?.length ?? 0}</span>
                </Row>
                <Row label="Items count">
                  <span className="font-mono">{publicItems?.length ?? 0}</span>
                </Row>
                {(publicPlans ?? []).map((p: any) => (
                  <div key={p._id} className="mt-1 text-xs">
                    <span className="font-semibold">{p.name ?? p.slug}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 rounded-lg border border-purple-100 bg-white p-3 dark:border-purple-900 dark:bg-gray-800">
              <p className="mb-2 text-xs font-bold text-purple-700 dark:text-purple-400">
                PricingPage render-prop component
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <code className="rounded bg-gray-100 px-1 text-xs dark:bg-gray-700">{`<PricingPage slug="main-pricing">`}</code>{" "}
                — renders children render prop with{" "}
                <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">{`{ loading, error, items, plans, refetch }`}</code>
              </p>
              {queriedPublicSlug && (
                <PricingPage slug={queriedPublicSlug}>
                  {({ loading: pgLoading, error: pgError, items: pgItems, plans: pgPlans }) => (
                    <div className="mt-2">
                      {pgLoading && <span className="text-xs text-gray-400">Loading…</span>}
                      {pgError && <span className="text-xs text-red-600">{pgError}</span>}
                      {!pgLoading && !pgError && (
                        <ResultBox ok={true}>
                          PricingPage OK — {pgPlans?.length ?? 0} plans, {pgItems?.length ?? 0} items
                        </ResultBox>
                      )}
                    </div>
                  )}
                </PricingPage>
              )}
            </div>
          </SectionCard>

          <SectionCard title="usePublicPlanGroupVersion" subtitle="Fetch a specific plan group version by version ID">
            {pgvLoading && <span className="text-xs text-gray-400">Loading…</span>}
            {pgvError && <span className="text-xs text-red-600">{String(pgvError)}</span>}
            {publicGroupVersion ? (
              <div className="rounded-lg border border-purple-100 bg-white p-3 text-xs dark:border-purple-900 dark:bg-gray-800">
                <Row label="Version ID">
                  <span className="font-mono text-xs">{(publicGroupVersion as any)?._id ?? "—"}</span>
                </Row>
                <Row label="Slug">
                  <span className="font-mono text-xs">{(publicGroupVersion as any)?.slug ?? "—"}</span>
                </Row>
              </div>
            ) : (
              <p className="text-xs text-gray-400">Fetch a plan group above to see version data.</p>
            )}
          </SectionCard>

          <SectionCard title="BetaForm" subtitle="Pre-built signup/waitlist form component">
            <div className="max-w-sm">
              <BetaForm
                onSuccess={() => alert("BetaForm: submitted successfully!")}
                onError={err => alert("BetaForm error: " + err)}
                showSuccessMessage={true}
                hideLogo={false}
                hideTitles={false}
              />
            </div>
          </SectionCard>
        </GroupCard>
      </div>
    </div>
  );
}
