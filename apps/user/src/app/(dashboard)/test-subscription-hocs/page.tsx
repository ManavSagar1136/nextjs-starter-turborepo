"use client";

import React, { useState } from "react";
import {
  // Subscription gates (read-only — cancel/purchase/resume handled by SDK modal)
  WhenSubscription,
  WhenNoSubscription,
  WhenSubscriptionToPlans,
  WhenTrialing,
  WhenNotTrialing,
  WhenTrialEnding,

  // Feature gates
  WhenWorkspaceFeatureEnabled,
  WhenWorkspaceFeatureDisabled,
  WhenUserFeatureEnabled,
  WhenUserFeatureDisabled,

  // Role gates
  WhenRoles,
  WhenWorkspaceRoles,

  // Subscription data (read-only)
  useSubscriptionContext,
  useSubscription,
  useSubscriptionManagement,

  // Feature & auth hooks
  useSaaSWorkspaces,
  useSaaSAuth,
  useUserFeatures,

  // Trial hook
  useTrialStatus,

  // Server-side proxy hooks
  useServerRecordUsage,
  useServerQuotaStatus,
  useServerAllQuotas,
} from "@buildbase/saas-sdk";

/**
 * Comprehensive Test Page for @buildbase/sdk - Organized by Flow
 *
 * Flow:
 * 1. Fetch Subscription Status - How to get subscription data
 * 2. Check Workspace Features Allocation - What features are allocated to workspace
 * 3. Check Feature Availability with HOCs/Hooks - How to check if features are available
 *
 * Navigate to: /test-subscription-hocs
 */

export default function TestSubscriptionHocsPage() {
  const { currentWorkspace } = useSaaSWorkspaces();
  const { response, loading } = useSubscriptionContext();
  const { user } = useSaaSAuth();
  const { features: userFeatures, isFeatureEnabled: isUserFeatureEnabled } = useUserFeatures();

  // Subscription Hooks
  const workspaceId = currentWorkspace?._id || null;
  const {
    subscription,
    loading: subscriptionLoading,
    error: subscriptionError,
    refetch: refetchSubscription,
  } = useSubscription(workspaceId);
  const {
    subscription: mgmtSubscription,
    planGroup: mgmtPlanGroup,
    loading: mgmtLoading,
    refetch: refetchManagement,
  } = useSubscriptionManagement(workspaceId);

  // Trial status (no args — reads from SubscriptionContext)
  const { isTrialing, isTrialEnding, daysRemaining } = useTrialStatus();

  // Extract subscription data
  const subscriptionStatus =
    response?.subscription?.subscriptionStatus || subscription?.subscription?.subscriptionStatus || "none";
  const planSlug = response?.plan?.slug || subscription?.plan?.slug || "none";
  const planVersion = response?.planVersion || subscription?.planVersion;
  const planFeatures = planVersion?.features || {};
  const planLimits = planVersion?.limits || {};
  const planQuotas = planVersion?.quotas || {};
  const subscriptionItems = planVersion?.subscriptionItems || [];

  // Workspace features
  const workspaceFeatures = currentWorkspace?.features || {};
  const workspaceFeatureKeys = Object.keys(workspaceFeatures);
  const enabledWorkspaceFeatures = workspaceFeatureKeys.filter(key => workspaceFeatures[key] === true);

  // Get feature names from subscription items
  const featureItems = subscriptionItems.filter((item: any) => item.type === "feature");
  const limitItems = subscriptionItems.filter((item: any) => item.type === "limit");
  const quotaItems = subscriptionItems.filter((item: any) => item.type === "quota");

  // Get enabled plan features with metadata
  const enabledPlanFeatures = Object.entries(planFeatures)
    .filter(([_, enabled]) => enabled === true)
    .map(([key]) => {
      const item = featureItems.find((f: any) => f.slug === key);
      return {
        slug: key,
        name: item?.name || key,
        description: item?.description,
        category: item?.category,
      };
    });

  // Get workspace feature slugs that are actually enabled
  const enabledWorkspaceFeatureSlugs = workspaceFeatureKeys.filter(key => workspaceFeatures[key] === true);

  // Get user feature slugs that are actually enabled
  const enabledUserFeatureSlugs = Object.entries(userFeatures)
    .filter(([_, enabled]) => enabled === true)
    .map(([key]) => key);

  const userRole = user?.role || "none";
  // Try to get workspace role from workspace users if available
  const workspaceUsers = currentWorkspace?.users || [];
  const workspaceRole =
    (Array.isArray(workspaceUsers)
      ? workspaceUsers.find((u: any) => u._id === user?.id || u.userId === user?.id)?.role
      : undefined) || "none";

  // ── Usage Tracking ────────────────────────────────────────────────────────────
  const [recordQuotaSlug, setRecordQuotaSlug] = useState("emails");
  const [recordQuantity, setRecordQuantity] = useState(1);
  const [statusQuotaSlug, setStatusQuotaSlug] = useState("emails");

  const {
    record,
    isLoading: recordLoading,
    data: recordData,
    error: recordError,
    reset: resetRecord,
  } = useServerRecordUsage();
  const {
    data: quotaStatus,
    isLoading: statusLoading,
    error: statusError,
    refetch: refetchStatus,
  } = useServerQuotaStatus({
    workspaceId: workspaceId ?? "",
    quotaSlug: statusQuotaSlug,
  });
  const {
    quotas: allQuotas,
    isLoading: allQuotasLoading,
    error: allQuotasError,
    refetch: refetchAllQuotas,
  } = useServerAllQuotas({ workspaceId: workspaceId ?? "" });

  return (
    <div className="min-h-screen bg-gray-50 p-8 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
            @buildbase/sdk Test Page - Feature Flow
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Step-by-step guide: Fetch Subscription → Check Features Allocation → Check Feature Availability
          </p>
        </div>

        {/* ====================================================================
            SECTION 1: FETCH SUBSCRIPTION STATUS
            ==================================================================== */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">1. Fetch Subscription Status</h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            Learn how to fetch and check subscription status using hooks
          </p>

          {/* useSubscriptionContext Hook */}
          <div className="mb-6 rounded-lg border-2 border-dashed border-gray-300 p-4 dark:border-gray-700">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">useSubscriptionContext Hook</h3>
            <div className="mb-3 rounded border-l-4 border-blue-500 bg-blue-50 p-4 dark:bg-blue-900/20">
              <p className="mb-2 font-mono text-sm text-blue-800 dark:text-blue-200">
                const {"{ response, loading }"} = useSubscriptionContext();
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Loading:</span>
                  <span
                    className={`rounded px-2 py-1 text-xs font-semibold ${loading ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}
                  >
                    {loading ? "Loading..." : "Loaded"}
                  </span>
                </div>
                {response && (
                  <div className="mt-3 space-y-1 text-sm">
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Status:</span>{" "}
                      <span
                        className={`rounded px-2 py-1 text-xs font-semibold ${
                          subscriptionStatus === "active"
                            ? "bg-green-100 text-green-800"
                            : subscriptionStatus === "trialing"
                              ? "bg-blue-100 text-blue-800"
                              : subscriptionStatus === "canceled"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {subscriptionStatus.toUpperCase()}
                      </span>
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Plan Slug:</span> {planSlug}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Plan Name:</span> {response.plan?.name || "N/A"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* useSubscription Hook */}
          <div className="mb-6 rounded-lg border-2 border-dashed border-gray-300 p-4 dark:border-gray-700">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">useSubscription Hook</h3>
            <div className="mb-3 rounded border-l-4 border-cyan-500 bg-cyan-50 p-4 dark:bg-cyan-900/20">
              <p className="mb-2 font-mono text-sm text-cyan-800 dark:text-cyan-200">
                const {"{ subscription, loading, error, refetch }"} = useSubscription(workspaceId);
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Loading:</span>
                  <span
                    className={`rounded px-2 py-1 text-xs font-semibold ${subscriptionLoading ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}
                  >
                    {subscriptionLoading ? "Loading..." : "Loaded"}
                  </span>
                </div>
                {subscriptionError && (
                  <div className="text-sm text-red-600 dark:text-red-400">Error: {subscriptionError}</div>
                )}
                {subscription && (
                  <div className="mt-3 space-y-1 text-sm">
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Status:</span>{" "}
                      {subscription.subscription?.subscriptionStatus || "N/A"}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Plan:</span>{" "}
                      {subscription.plan?.name || subscription.plan?.slug || "N/A"}
                    </p>
                    <button
                      onClick={() => refetchSubscription()}
                      className="mt-2 rounded bg-cyan-600 px-3 py-1 text-sm text-white transition hover:bg-cyan-700"
                    >
                      Refetch Subscription
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* useSubscriptionManagement Hook */}
          <div className="mb-6 rounded-lg border-2 border-dashed border-gray-300 p-4 dark:border-gray-700">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              useSubscriptionManagement Hook (Combined)
            </h3>
            <div className="mb-3 rounded border-l-4 border-emerald-500 bg-emerald-50 p-4 dark:bg-emerald-900/20">
              <p className="mb-2 font-mono text-sm text-emerald-800 dark:text-emerald-200">
                const {"{ subscription, planGroup, loading, refetch }"} = useSubscriptionManagement(workspaceId);
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Loading:</span>
                  <span
                    className={`rounded px-2 py-1 text-xs font-semibold ${mgmtLoading ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}
                  >
                    {mgmtLoading ? "Loading..." : "Loaded"}
                  </span>
                </div>
                {mgmtSubscription && mgmtPlanGroup && (
                  <div className="mt-3 space-y-1 text-sm">
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Subscription Status:</span>{" "}
                      {mgmtSubscription.subscription?.subscriptionStatus || "N/A"}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Plan Group:</span>{" "}
                      {mgmtPlanGroup?.group?.name || mgmtPlanGroup?.group?.slug || "N/A"}
                    </p>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Combines useSubscription, usePlanGroup, and useUpdateSubscription
                    </p>
                    <button
                      onClick={() => refetchManagement()}
                      className="mt-2 rounded bg-emerald-600 px-3 py-1 text-sm text-white transition hover:bg-emerald-700"
                    >
                      Refetch All
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================================
            SECTION 2: CHECK WORKSPACE FEATURES ALLOCATION
            ==================================================================== */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            2. Check Workspace Features Allocation
          </h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            See what features are allocated to your workspace from the subscription plan
          </p>

          {/* Plan Features (from subscription) */}
          <div className="mb-6 rounded-lg border-2 border-dashed border-gray-300 p-4 dark:border-gray-700">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Plan Features (Allocated from Subscription)
            </h3>
            <div className="rounded border-l-4 border-purple-500 bg-purple-50 p-4 dark:bg-purple-900/20">
              <p className="mb-3 text-sm text-purple-800 dark:text-purple-200">
                Features allocated from your subscription plan:
              </p>
              {enabledPlanFeatures.length > 0 ? (
                <div className="space-y-2">
                  {enabledPlanFeatures.map(feature => (
                    <div key={feature.slug} className="rounded bg-white p-3 dark:bg-gray-800">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">✅ {feature.name}</p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Slug: {feature.slug}</p>
                          {feature.description && (
                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{feature.description}</p>
                          )}
                          {feature.category && (
                            <span className="mt-1 inline-block rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                              {feature.category}
                            </span>
                          )}
                        </div>
                        <div className="ml-4">
                          <span className="rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900 dark:text-green-200">
                            Enabled
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No plan features allocated. Check your subscription plan.
                </p>
              )}
            </div>
          </div>

          {/* Plan Limits */}
          {Object.keys(planLimits).length > 0 && (
            <div className="mb-6 rounded-lg border-2 border-dashed border-gray-300 p-4 dark:border-gray-700">
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Plan Limits</h3>
              <div className="rounded border-l-4 border-indigo-500 bg-indigo-50 p-4 dark:bg-indigo-900/20">
                <div className="space-y-2">
                  {Object.entries(planLimits).map(([key, value]) => {
                    const limitItem = limitItems.find((item: any) => item.slug === key);
                    return (
                      <div key={key} className="rounded bg-white p-3 dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {limitItem?.name || key}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Slug: {key}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                              {typeof value === "number" ? value.toLocaleString() : String(value)}
                            </p>
                            {limitItem?.description && (
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{limitItem.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Plan Quotas */}
          {Object.keys(planQuotas).length > 0 && (
            <div className="mb-6 rounded-lg border-2 border-dashed border-gray-300 p-4 dark:border-gray-700">
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Plan Quotas</h3>
              <div className="rounded border-l-4 border-teal-500 bg-teal-50 p-4 dark:bg-teal-900/20">
                <div className="space-y-2">
                  {Object.entries(planQuotas)
                    .slice(0, 5)
                    .map(([key, value]) => {
                      const quotaItem = quotaItems.find((item: any) => item.slug === key);
                      return (
                        <div key={key} className="rounded bg-white p-3 dark:bg-gray-800">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {quotaItem?.name || key}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Slug: {key}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {typeof value === "object" ? JSON.stringify(value) : String(value)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* Workspace Features (enabled/disabled flags) */}
          <div className="mb-6 rounded-lg border-2 border-dashed border-gray-300 p-4 dark:border-gray-700">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Workspace Feature Flags</h3>
            <div className="rounded border-l-4 border-amber-500 bg-amber-50 p-4 dark:bg-amber-900/20">
              <p className="mb-3 text-sm text-amber-800 dark:text-amber-200">Feature flags set at workspace level:</p>
              {workspaceFeatureKeys.length > 0 ? (
                <div className="space-y-2">
                  {workspaceFeatureKeys.map(key => (
                    <div key={key} className="rounded bg-white p-3 dark:bg-gray-800">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-900 dark:text-white">{key}</span>
                        <span
                          className={`rounded px-2 py-1 text-xs font-semibold ${
                            workspaceFeatures[key]
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
                          {workspaceFeatures[key] ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No workspace feature flags configured</p>
              )}
            </div>
          </div>

          {/* User Features */}
          <div className="mb-6 rounded-lg border-2 border-dashed border-gray-300 p-4 dark:border-gray-700">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">User Feature Flags</h3>
            <div className="rounded border-l-4 border-violet-500 bg-violet-50 p-4 dark:bg-violet-900/20">
              <p className="mb-3 text-sm text-violet-800 dark:text-violet-200">Feature flags set at user level:</p>
              {Object.keys(userFeatures).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(userFeatures).map(([key, value]) => (
                    <div key={key} className="rounded bg-white p-3 dark:bg-gray-800">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-900 dark:text-white">{key}</span>
                        <span
                          className={`rounded px-2 py-1 text-xs font-semibold ${
                            value
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
                          {value ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No user feature flags configured</p>
              )}
            </div>
          </div>
        </div>

        {/* ====================================================================
            SECTION 3: CHECK FEATURE AVAILABILITY WITH HOCS/HOOKS
            ==================================================================== */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            3. Check Feature Availability with HOCs/Hooks
          </h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            Use HOCs and hooks to conditionally render content based on feature availability
          </p>

          {/* Subscription HOCs */}
          <div className="mb-8">
            <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">3.1 Subscription HOCs</h3>

            {/* WhenSubscription */}
            <div className="mb-6 rounded-lg border-2 border-dashed border-gray-300 p-4 dark:border-gray-700">
              <h4 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                WhenSubscription - Check if workspace has active subscription
              </h4>
              <p className="mb-3 font-mono text-sm text-gray-600 dark:text-gray-400">
                {"<WhenSubscription>...</WhenSubscription>"}
              </p>
              <WhenSubscription
                fallbackComponent={
                  <div className="rounded border-l-4 border-red-500 bg-red-50 p-4 dark:bg-red-900/20">
                    <p className="font-semibold text-red-800 dark:text-red-200">❌ No active subscription</p>
                  </div>
                }
              >
                <div className="rounded border-l-4 border-green-500 bg-green-50 p-4 dark:bg-green-900/20">
                  <p className="font-semibold text-green-800 dark:text-green-200">✅ Active subscription detected</p>
                  <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                    Status: {subscriptionStatus} | Plan: {planSlug}
                  </p>
                </div>
              </WhenSubscription>
            </div>

            {/* WhenNoSubscription */}
            <div className="mb-6 rounded-lg border-2 border-dashed border-gray-300 p-4 dark:border-gray-700">
              <h4 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                WhenNoSubscription - Check if workspace has no subscription
              </h4>
              <p className="mb-3 font-mono text-sm text-gray-600 dark:text-gray-400">
                {"<WhenNoSubscription>...</WhenNoSubscription>"}
              </p>
              <WhenNoSubscription
                fallbackComponent={
                  <div className="rounded border-l-4 border-green-500 bg-green-50 p-4 dark:bg-green-900/20">
                    <p className="font-semibold text-green-800 dark:text-green-200">✅ You have a subscription</p>
                  </div>
                }
              >
                <div className="rounded border-l-4 border-blue-500 bg-blue-50 p-4 dark:bg-blue-900/20">
                  <p className="font-semibold text-blue-800 dark:text-blue-200">✅ No subscription found</p>
                  <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">Subscribe to unlock features</p>
                </div>
              </WhenNoSubscription>
            </div>

            {/* WhenSubscriptionToPlans */}
            <div className="mb-6 rounded-lg border-2 border-dashed border-gray-300 p-4 dark:border-gray-700">
              <h4 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                WhenSubscriptionToPlans - Check if subscribed to specific plans
              </h4>
              <p className="mb-3 font-mono text-sm text-gray-600 dark:text-gray-400">
                {"<WhenSubscriptionToPlans plans={[planSlug]}>...</WhenSubscriptionToPlans>"}
              </p>
              {planSlug !== "none" ? (
                <WhenSubscriptionToPlans
                  plans={[planSlug]}
                  fallbackComponent={
                    <div className="rounded border-l-4 border-orange-500 bg-orange-50 p-4 dark:bg-orange-900/20">
                      <p className="font-semibold text-orange-800 dark:text-orange-200">
                        ❌ Plan "{planSlug}" not matching
                      </p>
                      <p className="mt-1 text-sm text-orange-700 dark:text-orange-300">Current plan: {planSlug}</p>
                    </div>
                  }
                >
                  <div className="rounded border-l-4 border-purple-500 bg-purple-50 p-4 dark:bg-purple-900/20">
                    <p className="font-semibold text-purple-800 dark:text-purple-200">✅ Plan "{planSlug}" detected</p>
                    <p className="mt-1 text-sm text-purple-700 dark:text-purple-300">
                      You're subscribed to: {planSlug}
                    </p>
                  </div>
                </WhenSubscriptionToPlans>
              ) : (
                <div className="rounded border-l-4 border-gray-500 bg-gray-50 p-4 dark:bg-gray-900/20">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">ℹ️ No plan subscription found</p>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                    Subscribe to a plan to see this HOC in action
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Workspace Feature HOCs */}
          <div className="mb-8">
            <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">3.2 Workspace Feature HOCs</h3>

            {/* WhenWorkspaceFeatureEnabled */}
            {enabledWorkspaceFeatureSlugs.length > 0 ? (
              enabledWorkspaceFeatureSlugs.slice(0, 2).map(featureSlug => (
                <div
                  key={featureSlug}
                  className="mb-6 rounded-lg border-2 border-dashed border-gray-300 p-4 dark:border-gray-700"
                >
                  <h4 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                    WhenWorkspaceFeatureEnabled - Check if workspace feature is enabled
                  </h4>
                  <p className="mb-3 font-mono text-sm text-gray-600 dark:text-gray-400">
                    {'<WhenWorkspaceFeatureEnabled slug="' + featureSlug + '">...</WhenWorkspaceFeatureEnabled>'}
                  </p>
                  <WhenWorkspaceFeatureEnabled slug={featureSlug}>
                    <div className="rounded border-l-4 border-emerald-500 bg-emerald-50 p-4 dark:bg-emerald-900/20">
                      <p className="font-semibold text-emerald-800 dark:text-emerald-200">
                        ✅ Feature "{featureSlug}" is enabled
                      </p>
                    </div>
                  </WhenWorkspaceFeatureEnabled>
                </div>
              ))
            ) : (
              <div className="mb-6 rounded-lg border-2 border-dashed border-gray-300 p-4 dark:border-gray-700">
                <h4 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                  WhenWorkspaceFeatureEnabled - Example
                </h4>
                <p className="mb-3 font-mono text-sm text-gray-600 dark:text-gray-400">
                  {'<WhenWorkspaceFeatureEnabled slug="feature-name">...</WhenWorkspaceFeatureEnabled>'}
                </p>
                <div className="rounded border-l-4 border-gray-500 bg-gray-50 p-4 dark:bg-gray-900/20">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    ℹ️ No enabled workspace features to demonstrate
                  </p>
                </div>
              </div>
            )}

            {/* WhenWorkspaceFeatureDisabled */}
            {workspaceFeatureKeys.length > enabledWorkspaceFeatureSlugs.length ? (
              workspaceFeatureKeys
                .filter(key => workspaceFeatures[key] === false)
                .slice(0, 1)
                .map(featureSlug => (
                  <div
                    key={featureSlug}
                    className="mb-6 rounded-lg border-2 border-dashed border-gray-300 p-4 dark:border-gray-700"
                  >
                    <h4 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                      WhenWorkspaceFeatureDisabled - Check if workspace feature is disabled
                    </h4>
                    <p className="mb-3 font-mono text-sm text-gray-600 dark:text-gray-400">
                      {'<WhenWorkspaceFeatureDisabled slug="' + featureSlug + '">...</WhenWorkspaceFeatureDisabled>'}
                    </p>
                    <WhenWorkspaceFeatureDisabled slug={featureSlug}>
                      <div className="rounded border-l-4 border-amber-500 bg-amber-50 p-4 dark:bg-amber-900/20">
                        <p className="font-semibold text-amber-800 dark:text-amber-200">
                          ✅ Feature "{featureSlug}" is disabled
                        </p>
                      </div>
                    </WhenWorkspaceFeatureDisabled>
                  </div>
                ))
            ) : (
              <div className="mb-6 rounded-lg border-2 border-dashed border-gray-300 p-4 dark:border-gray-700">
                <h4 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                  WhenWorkspaceFeatureDisabled - Example
                </h4>
                <p className="mb-3 font-mono text-sm text-gray-600 dark:text-gray-400">
                  {'<WhenWorkspaceFeatureDisabled slug="feature-name">...</WhenWorkspaceFeatureDisabled>'}
                </p>
                <div className="rounded border-l-4 border-gray-500 bg-gray-50 p-4 dark:bg-gray-900/20">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    ℹ️ All workspace features are enabled
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* User Feature HOCs */}
          <div className="mb-8">
            <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">3.3 User Feature HOCs</h3>

            {/* WhenUserFeatureEnabled */}
            {enabledUserFeatureSlugs.length > 0 ? (
              enabledUserFeatureSlugs.slice(0, 2).map(featureSlug => (
                <div
                  key={featureSlug}
                  className="mb-6 rounded-lg border-2 border-dashed border-gray-300 p-4 dark:border-gray-700"
                >
                  <h4 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                    WhenUserFeatureEnabled - Check if user feature is enabled
                  </h4>
                  <p className="mb-3 font-mono text-sm text-gray-600 dark:text-gray-400">
                    {'<WhenUserFeatureEnabled slug="' + featureSlug + '">...</WhenUserFeatureEnabled>'}
                  </p>
                  <WhenUserFeatureEnabled slug={featureSlug}>
                    <div className="rounded border-l-4 border-violet-500 bg-violet-50 p-4 dark:bg-violet-900/20">
                      <p className="font-semibold text-violet-800 dark:text-violet-200">
                        ✅ User feature "{featureSlug}" is enabled
                      </p>
                    </div>
                  </WhenUserFeatureEnabled>
                </div>
              ))
            ) : (
              <div className="mb-6 rounded-lg border-2 border-dashed border-gray-300 p-4 dark:border-gray-700">
                <h4 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                  WhenUserFeatureEnabled - Example
                </h4>
                <p className="mb-3 font-mono text-sm text-gray-600 dark:text-gray-400">
                  {'<WhenUserFeatureEnabled slug="feature-name">...</WhenUserFeatureEnabled>'}
                </p>
                <div className="rounded border-l-4 border-gray-500 bg-gray-50 p-4 dark:bg-gray-900/20">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    ℹ️ No enabled user features to demonstrate
                  </p>
                </div>
              </div>
            )}

            {/* WhenUserFeatureDisabled */}
            {Object.keys(userFeatures).length > enabledUserFeatureSlugs.length ? (
              Object.entries(userFeatures)
                .filter(([_, enabled]) => enabled === false)
                .slice(0, 1)
                .map(([featureSlug]) => (
                  <div
                    key={featureSlug}
                    className="mb-6 rounded-lg border-2 border-dashed border-gray-300 p-4 dark:border-gray-700"
                  >
                    <h4 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                      WhenUserFeatureDisabled - Check if user feature is disabled
                    </h4>
                    <p className="mb-3 font-mono text-sm text-gray-600 dark:text-gray-400">
                      {'<WhenUserFeatureDisabled slug="' + featureSlug + '">...</WhenUserFeatureDisabled>'}
                    </p>
                    <WhenUserFeatureDisabled slug={featureSlug}>
                      <div className="rounded border-l-4 border-slate-500 bg-slate-50 p-4 dark:bg-slate-900/20">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          ✅ User feature "{featureSlug}" is disabled
                        </p>
                      </div>
                    </WhenUserFeatureDisabled>
                  </div>
                ))
            ) : (
              <div className="mb-6 rounded-lg border-2 border-dashed border-gray-300 p-4 dark:border-gray-700">
                <h4 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                  WhenUserFeatureDisabled - Example
                </h4>
                <p className="mb-3 font-mono text-sm text-gray-600 dark:text-gray-400">
                  {'<WhenUserFeatureDisabled slug="feature-name">...</WhenUserFeatureDisabled>'}
                </p>
                <div className="rounded border-l-4 border-gray-500 bg-gray-50 p-4 dark:bg-gray-900/20">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">ℹ️ All user features are enabled</p>
                </div>
              </div>
            )}
          </div>

          {/* Role HOCs */}
          <div className="mb-8">
            <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">3.4 Role-Based Access HOCs</h3>

            {/* WhenRoles */}
            <div className="mb-6 rounded-lg border-2 border-dashed border-gray-300 p-4 dark:border-gray-700">
              <h4 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                WhenRoles - Check global user role
              </h4>
              <p className="mb-3 font-mono text-sm text-gray-600 dark:text-gray-400">
                {"<WhenRoles roles={[userRole]}>...</WhenRoles>"}
              </p>
              {userRole !== "none" ? (
                <WhenRoles
                  roles={[userRole]}
                  fallback={
                    <div className="rounded border-l-4 border-gray-500 bg-gray-50 p-4 dark:bg-gray-900/20">
                      <p className="font-semibold text-gray-800 dark:text-gray-200">
                        ❌ Role "{userRole}" not matching
                      </p>
                      <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">Current role: {userRole}</p>
                    </div>
                  }
                >
                  <div className="rounded border-l-4 border-rose-500 bg-rose-50 p-4 dark:bg-rose-900/20">
                    <p className="font-semibold text-rose-800 dark:text-rose-200">✅ Role "{userRole}" detected</p>
                    <p className="mt-1 text-sm text-rose-700 dark:text-rose-300">Your current role: {userRole}</p>
                  </div>
                </WhenRoles>
              ) : (
                <div className="rounded border-l-4 border-gray-500 bg-gray-50 p-4 dark:bg-gray-900/20">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">ℹ️ No user role found</p>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                    User role will be checked when available
                  </p>
                </div>
              )}
            </div>

            {/* WhenWorkspaceRoles */}
            <div className="mb-6 rounded-lg border-2 border-dashed border-gray-300 p-4 dark:border-gray-700">
              <h4 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                WhenWorkspaceRoles - Check workspace role
              </h4>
              <p className="mb-3 font-mono text-sm text-gray-600 dark:text-gray-400">
                {"<WhenWorkspaceRoles roles={[workspaceRole]}>...</WhenWorkspaceRoles>"}
              </p>
              {workspaceRole !== "none" ? (
                <WhenWorkspaceRoles
                  roles={[workspaceRole]}
                  fallback={
                    <div className="rounded border-l-4 border-gray-500 bg-gray-50 p-4 dark:bg-gray-900/20">
                      <p className="font-semibold text-gray-800 dark:text-gray-200">
                        ❌ Workspace role "{workspaceRole}" not matching
                      </p>
                      <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                        Current workspace role: {workspaceRole}
                      </p>
                    </div>
                  }
                >
                  <div className="rounded border-l-4 border-fuchsia-500 bg-fuchsia-50 p-4 dark:bg-fuchsia-900/20">
                    <p className="font-semibold text-fuchsia-800 dark:text-fuchsia-200">
                      ✅ Workspace role "{workspaceRole}" detected
                    </p>
                    <p className="mt-1 text-sm text-fuchsia-700 dark:text-fuchsia-300">
                      Your workspace role: {workspaceRole}
                    </p>
                  </div>
                </WhenWorkspaceRoles>
              ) : (
                <div className="rounded border-l-4 border-gray-500 bg-gray-50 p-4 dark:bg-gray-900/20">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">ℹ️ No workspace role found</p>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                    Workspace role will be checked when available
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Hook-based Feature Checking */}
          <div className="mb-8">
            <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              3.5 Hook-based Feature Checking
            </h3>

            {/* useUserFeatures Hook */}
            <div className="mb-6 rounded-lg border-2 border-dashed border-gray-300 p-4 dark:border-gray-700">
              <h4 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                useUserFeatures Hook - Check user features programmatically
              </h4>
              <p className="mb-3 font-mono text-sm text-gray-600 dark:text-gray-400">
                const {"{ features, isFeatureEnabled }"} = useUserFeatures();
              </p>
              <div className="rounded border-l-4 border-violet-500 bg-violet-50 p-4 dark:bg-violet-900/20">
                <p className="mb-2 text-sm text-violet-800 dark:text-violet-200">Available user features:</p>
                {Object.keys(userFeatures).length > 0 ? (
                  <div className="space-y-1">
                    {Object.entries(userFeatures)
                      .slice(0, 5)
                      .map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between rounded bg-white p-2 dark:bg-gray-800"
                        >
                          <span className="text-sm text-gray-700 dark:text-gray-300">{key}</span>
                          <span
                            className={`rounded px-2 py-0.5 text-xs font-semibold ${
                              value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {value ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No user features configured</p>
                )}
                <div className="mt-3 border-t border-violet-200 pt-3 dark:border-violet-800">
                  {enabledUserFeatureSlugs.length > 0 ? (
                    <div className="space-y-1">
                      <p className="mb-1 text-xs font-semibold text-violet-700 dark:text-violet-300">Example checks:</p>
                      {enabledUserFeatureSlugs.slice(0, 2).map(featureSlug => (
                        <p key={featureSlug} className="text-xs text-violet-700 dark:text-violet-300">
                          isFeatureEnabled("{featureSlug}") = {isUserFeatureEnabled(featureSlug) ? "true" : "false"}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-violet-700 dark:text-violet-300">
                      Example: isFeatureEnabled("feature-slug") ={" "}
                      {Object.keys(userFeatures).length > 0 ? "true/false" : "false"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Programmatic Feature Check Example */}
            <div className="mb-6 rounded-lg border-2 border-dashed border-gray-300 p-4 dark:border-gray-700">
              <h4 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Programmatic Feature Check Example
              </h4>
              <div className="rounded bg-gray-50 p-4 dark:bg-gray-900">
                <pre className="overflow-x-auto text-xs text-gray-700 dark:text-gray-300">
                  {`// Check subscription status
const { response } = useSubscriptionContext();
const hasActiveSubscription = 
  response?.subscription?.subscriptionStatus === "active" || 
  response?.subscription?.subscriptionStatus === "trialing";

// Check plan features (using actual plan features)
const planFeatures = response?.planVersion?.features || {};
${enabledPlanFeatures.length > 0 && enabledPlanFeatures[0] ? `const hasFeature = planFeatures["${enabledPlanFeatures[0].slug}"] === true;` : '// const hasFeature = planFeatures["feature-slug"] === true;'}

// Check workspace features (using actual workspace features)
const { currentWorkspace } = useSaaSWorkspaces();
const workspaceFeatures = currentWorkspace?.features || {};
${enabledWorkspaceFeatureSlugs.length > 0 ? `const hasWorkspaceFeature = workspaceFeatures["${enabledWorkspaceFeatureSlugs[0]}"] === true;` : '// const hasWorkspaceFeature = workspaceFeatures["feature-slug"] === true;'}

// Check user features (using actual user features)
const { isFeatureEnabled } = useUserFeatures();
${enabledUserFeatureSlugs.length > 0 ? `const hasUserFeature = isFeatureEnabled("${enabledUserFeatureSlugs[0]}");` : '// const hasUserFeature = isFeatureEnabled("feature-slug");'}`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================================
            SECTION 4: TRIAL STATUS GATES
            ==================================================================== */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">4. Trial Status Gates</h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            Use trial HOCs and{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-700">useTrialStatus</code> to
            conditionally render content based on trial state. Subscription cancel/resume/purchase is handled by the SDK
            manage workspace modal — read-only from our app.
          </p>

          {/* useTrialStatus */}
          <div className="mb-6 rounded-lg border-2 border-dashed border-gray-300 p-4 dark:border-gray-700">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">useTrialStatus Hook</h3>
            <div className="mb-3 rounded border-l-4 border-teal-500 bg-teal-50 p-4 dark:bg-teal-900/20">
              <p className="mb-2 font-mono text-sm text-teal-800 dark:text-teal-200">
                {"const { isTrialing, isTrialEnding, daysRemaining } = useTrialStatus();"}
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Is Trialing:</span>
                  <span
                    className={`rounded px-2 py-1 text-xs font-semibold ${isTrialing ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}
                  >
                    {isTrialing ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Trial Ending Soon:</span>
                  <span
                    className={`rounded px-2 py-1 text-xs font-semibold ${isTrialEnding ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-800"}`}
                  >
                    {isTrialEnding ? "Yes" : "No"}
                  </span>
                </div>
                {daysRemaining !== undefined && daysRemaining !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Days Remaining:</span>
                    <span className="font-mono text-xs font-semibold text-gray-800 dark:text-gray-200">
                      {daysRemaining}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Trial HOCs */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* WhenTrialing */}
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 dark:border-gray-700">
              <h4 className="mb-2 font-semibold text-gray-900 dark:text-white">WhenTrialing</h4>
              <p className="mb-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                {"<WhenTrialing>...</WhenTrialing>"}
              </p>
              <WhenTrialing
                fallbackComponent={
                  <div className="rounded border-l-4 border-gray-400 bg-gray-50 p-3 dark:bg-gray-900/20">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Not currently trialing</p>
                  </div>
                }
              >
                <div className="rounded border-l-4 border-teal-500 bg-teal-50 p-3 dark:bg-teal-900/20">
                  <p className="text-sm font-semibold text-teal-800 dark:text-teal-200">Currently on trial</p>
                </div>
              </WhenTrialing>
            </div>

            {/* WhenNotTrialing */}
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 dark:border-gray-700">
              <h4 className="mb-2 font-semibold text-gray-900 dark:text-white">WhenNotTrialing</h4>
              <p className="mb-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                {"<WhenNotTrialing>...</WhenNotTrialing>"}
              </p>
              <WhenNotTrialing
                fallbackComponent={
                  <div className="rounded border-l-4 border-gray-400 bg-gray-50 p-3 dark:bg-gray-900/20">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Currently trialing</p>
                  </div>
                }
              >
                <div className="rounded border-l-4 border-green-500 bg-green-50 p-3 dark:bg-green-900/20">
                  <p className="text-sm font-semibold text-green-800 dark:text-green-200">Not on trial (active/paid)</p>
                </div>
              </WhenNotTrialing>
            </div>

            {/* WhenTrialEnding */}
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 dark:border-gray-700">
              <h4 className="mb-2 font-semibold text-gray-900 dark:text-white">WhenTrialEnding</h4>
              <p className="mb-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                {"<WhenTrialEnding daysThreshold={7}>...</WhenTrialEnding>"}
              </p>
              <WhenTrialEnding
                daysThreshold={7}
                fallbackComponent={
                  <div className="rounded border-l-4 border-gray-400 bg-gray-50 p-3 dark:bg-gray-900/20">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Trial not ending within 7 days</p>
                  </div>
                }
              >
                <div className="rounded border-l-4 border-amber-500 bg-amber-50 p-3 dark:bg-amber-900/20">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                    Trial ending soon! (&lt;7 days)
                  </p>
                </div>
              </WhenTrialEnding>
            </div>
          </div>
        </div>

        {/* ── Usage Tracking ─────────────────────────────────────────────── */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">
            Usage Tracking (Server-side Secure)
          </h2>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            All calls go through{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-700">/api/saas/usage/*</code> — the{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-700">sessionId</code> stays in an
            HttpOnly cookie and never reaches the browser.
            {!workspaceId && (
              <span className="ml-2 font-semibold text-amber-600 dark:text-amber-400">
                ⚠ No workspace selected — hooks are paused until workspaceId is available.
              </span>
            )}
          </p>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Record Usage */}
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-700 dark:bg-purple-900/20">
              <h3 className="mb-3 font-semibold text-purple-900 dark:text-purple-200">1. Record Usage</h3>
              <p className="mb-3 text-xs text-purple-700 dark:text-purple-300">
                POST <code>/api/saas/usage/record</code>
              </p>
              <div className="mb-2 space-y-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-purple-800 dark:text-purple-300">
                    Quota Slug
                  </label>
                  <input
                    type="text"
                    value={recordQuotaSlug}
                    onChange={e => setRecordQuotaSlug(e.target.value)}
                    placeholder="e.g. emails"
                    className="w-full rounded border border-purple-300 bg-white px-2 py-1 text-sm dark:border-purple-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-purple-800 dark:text-purple-300">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={recordQuantity}
                    onChange={e => setRecordQuantity(Number(e.target.value))}
                    className="w-full rounded border border-purple-300 bg-white px-2 py-1 text-sm dark:border-purple-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    workspaceId &&
                    record({ workspaceId, quotaSlug: recordQuotaSlug, quantity: recordQuantity, source: "test-page" })
                  }
                  disabled={recordLoading || !workspaceId}
                  className="flex-1 rounded bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {recordLoading ? "Recording..." : "Record"}
                </button>
                {recordData && (
                  <button
                    onClick={resetRecord}
                    className="rounded border border-purple-300 px-3 py-1.5 text-sm text-purple-700 hover:bg-purple-100 dark:text-purple-300 dark:hover:bg-purple-900"
                  >
                    Clear
                  </button>
                )}
              </div>
              {recordError && (
                <div className="mt-2 rounded bg-red-100 p-2 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300">
                  Error: {recordError}
                </div>
              )}
              {recordData && (
                <div
                  className={`mt-2 rounded p-2 text-xs ${recordData.success ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"}`}
                >
                  <pre className="overflow-auto whitespace-pre-wrap">{JSON.stringify(recordData, null, 2)}</pre>
                </div>
              )}
            </div>

            {/* Single Quota Status */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-900/20">
              <h3 className="mb-3 font-semibold text-blue-900 dark:text-blue-200">2. Quota Status</h3>
              <p className="mb-3 text-xs text-blue-700 dark:text-blue-300">
                GET <code>/api/saas/usage/status</code>
              </p>
              <div className="mb-3 space-y-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-blue-800 dark:text-blue-300">Quota Slug</label>
                  <input
                    type="text"
                    value={statusQuotaSlug}
                    onChange={e => setStatusQuotaSlug(e.target.value)}
                    placeholder="e.g. emails"
                    className="w-full rounded border border-blue-300 bg-white px-2 py-1 text-sm dark:border-blue-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>
              <button
                onClick={refetchStatus}
                disabled={statusLoading || !workspaceId}
                className="w-full rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {statusLoading ? "Fetching..." : "Fetch Status"}
              </button>
              {statusError && (
                <div className="mt-2 rounded bg-red-100 p-2 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300">
                  Error: {statusError}
                </div>
              )}
              {quotaStatus && (
                <div className="mt-2 space-y-1 rounded bg-white p-3 text-xs dark:bg-gray-700">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Slug</span>
                    <span className="font-mono font-medium">{quotaStatus.quotaSlug}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Consumed</span>
                    <span className="font-medium">{quotaStatus.consumed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Included (limit)</span>
                    <span className="font-medium">{quotaStatus.included}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Available</span>
                    <span className="font-medium">{quotaStatus.available}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Overage</span>
                    <span className="font-medium">{quotaStatus.overage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Has Overage</span>
                    <span
                      className={`font-medium ${quotaStatus.hasOverage ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
                    >
                      {quotaStatus.hasOverage ? "Yes" : "No"}
                    </span>
                  </div>
                  {quotaStatus.included > 0 && (
                    <div className="mt-2">
                      <div className="mb-1 flex justify-between text-gray-500 dark:text-gray-400">
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
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-700 dark:bg-green-900/20">
              <h3 className="mb-3 font-semibold text-green-900 dark:text-green-200">3. All Quotas</h3>
              <p className="mb-3 text-xs text-green-700 dark:text-green-300">
                GET <code>/api/saas/usage/all</code>
              </p>
              <button
                onClick={refetchAllQuotas}
                disabled={allQuotasLoading || !workspaceId}
                className="w-full rounded bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {allQuotasLoading ? "Fetching..." : "Fetch All Quotas"}
              </button>
              {allQuotasError && (
                <div className="mt-2 rounded bg-red-100 p-2 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300">
                  Error: {allQuotasError}
                </div>
              )}
              {allQuotas && (
                <div className="mt-2 space-y-2">
                  {Object.keys(allQuotas).length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">No quotas found for this workspace.</p>
                  ) : (
                    Object.entries(allQuotas).map(([slug, quota]) => (
                      <div key={slug} className="rounded bg-white p-2 text-xs dark:bg-gray-700">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">{slug}</span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-xs font-medium ${quota.available <= 0 ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" : quota.hasOverage ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"}`}
                          >
                            {quota.available <= 0 ? "Exhausted" : quota.hasOverage ? "Overage" : "OK"}
                          </span>
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          {quota.consumed} / {quota.included}
                          {quota.available > 0 && ` (${quota.available} left)`}
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
        </div>

        {/* Summary */}
        <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-6 dark:bg-blue-900/20">
          <h2 className="mb-3 text-xl font-semibold text-blue-900 dark:text-blue-200">📋 Quick Reference</h2>
          <div className="space-y-3 text-blue-800 dark:text-blue-300">
            <div>
              <h3 className="mb-1 font-semibold">1. Fetch Subscription Status:</h3>
              <ul className="ml-4 space-y-1 text-sm">
                <li>• useSubscriptionContext() - Get subscription from context</li>
                <li>• useSubscription(workspaceId) - Fetch subscription for workspace</li>
                <li>• useSubscriptionManagement(workspaceId) - Combined subscription + plan group</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-1 font-semibold">2. Check Features Allocation:</h3>
              <ul className="ml-4 space-y-1 text-sm">
                <li>• response.planVersion.features - Plan features (boolean flags)</li>
                <li>• response.planVersion.limits - Plan limits (numeric values)</li>
                <li>• response.planVersion.quotas - Plan quotas (usage-based)</li>
                <li>• currentWorkspace.features - Workspace feature flags</li>
                <li>• useUserFeatures().features - User feature flags</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-1 font-semibold">3. Check Feature Availability:</h3>
              <ul className="ml-4 space-y-1 text-sm">
                <li>• WhenSubscription - Check active subscription</li>
                <li>• WhenSubscriptionToPlans - Check specific plan</li>
                <li>• WhenWorkspaceFeatureEnabled - Check workspace feature</li>
                <li>• WhenUserFeatureEnabled - Check user feature</li>
                <li>• WhenRoles / WhenWorkspaceRoles - Check user roles</li>
                <li>• useUserFeatures().isFeatureEnabled() - Programmatic check</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-1 font-semibold">4. Trial Status Gates:</h3>
              <ul className="ml-4 space-y-1 text-sm">
                <li>• useTrialStatus(workspaceId) - Get trial status data</li>
                <li>• WhenTrialing - Render only when on trial</li>
                <li>• WhenNotTrialing - Render when not on trial</li>
                <li>• WhenTrialEnding daysThreshold - Render when trial ending soon</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-1 font-semibold">5. Usage Tracking (Server-side Secure):</h3>
              <ul className="ml-4 space-y-1 text-sm">
                <li>• useServerRecordUsage() → record() — POST /api/saas/usage/record</li>
                <li>• useServerQuotaStatus(workspaceId, quotaSlug) — GET /api/saas/usage/status</li>
                <li>• useServerAllQuotas(workspaceId) — GET /api/saas/usage/all</li>
                <li>• sessionId stays in HttpOnly cookie — never sent from browser</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-1 font-semibold">6. Quota Gate HOCs (wrap feature code):</h3>
              <ul className="ml-4 space-y-1 text-sm">
                <li>• WhenQuotaAvailable slug — render when quota not exhausted</li>
                <li>• WhenQuotaExhausted slug — render when quota is exhausted</li>
                <li>• WhenQuotaOverage slug — render when in overage</li>
                <li>• WhenQuotaThreshold slug threshold — render near quota limit</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
