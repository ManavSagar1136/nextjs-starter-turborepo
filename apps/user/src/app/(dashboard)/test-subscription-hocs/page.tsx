"use client";

import React from "react";
import {
  WhenSubscription,
  WhenNoSubscription,
  WhenSubscriptionToPlans,
  WhenWorkspaceFeatureEnabled,
  WhenWorkspaceFeatureDisabled,
  WhenUserFeatureEnabled,
  WhenUserFeatureDisabled,
  WhenRoles,
  WhenWorkspaceRoles,
  useSubscriptionContext,
  useSubscription,
  useSubscriptionManagement,
  usePlanGroup,
  usePlanGroupVersions,
  usePublicPlans,
  useInvoices,
  useCreateCheckoutSession,
  useUpdateSubscription,
  useSaaSWorkspaces,
  useSaaSAuth,
  useUserFeatures,
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
    planGroup,
    loading: planGroupLoading,
    error: planGroupError,
    refetch: refetchPlanGroup,
  } = usePlanGroup(workspaceId);
  const { versions, loading: versionsLoading } = usePlanGroupVersions(workspaceId);
  const {
    subscription: mgmtSubscription,
    planGroup: mgmtPlanGroup,
    loading: mgmtLoading,
    updateSubscription: mgmtUpdateSubscription,
    refetch: refetchManagement,
  } = useSubscriptionManagement(workspaceId);
  const {
    invoices,
    hasMore: hasMoreInvoices,
    loading: invoicesLoading,
    refetch: refetchInvoices,
  } = useInvoices(workspaceId, 5);
  const { createCheckoutSession, loading: checkoutLoading } = useCreateCheckoutSession(workspaceId);
  const { updateSubscription: updateSub, loading: updateLoading } = useUpdateSubscription(workspaceId);

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
          </div>
        </div>
      </div>
    </div>
  );
}
