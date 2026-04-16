// Re-export all React-facing functionalities from @buildbase/sdk/react
export {
  // Core Provider and Config
  SaaSOSProvider,
  useSaaSOs,
  useSaaSSettings,

  // Auth
  useSaaSAuth,
  AuthStatus,

  // Conditional render — Auth
  WhenAuthenticated,
  WhenUnauthenticated,

  // Conditional render — Roles & Features
  WhenRoles,
  WhenWorkspaceRoles,
  WhenWorkspaceFeatureDisabled,
  WhenWorkspaceFeatureEnabled,
  WhenUserFeatureEnabled,
  WhenUserFeatureDisabled,

  // Workspace
  useSaaSWorkspaces,
  WorkspaceSwitcher,

  // User
  useUserFeatures,
  useUserAttributes,

  // Subscription
  SubscriptionContextProvider,
  useSubscriptionContext,
  useSubscription,
  useSubscriptionManagement,
  useCancelSubscription,
  useResumeSubscription,
  usePlanGroup,
  usePlanGroupVersions,
  useCreateCheckoutSession,
  useUpdateSubscription,
  invalidateSubscription,

  // Subscription conditional render
  WhenSubscription,
  WhenNoSubscription,
  WhenSubscriptionToPlans,

  // Trial conditional render
  WhenTrialing,
  WhenNotTrialing,
  WhenTrialEnding,

  // Public pricing
  usePublicPlans,
  usePublicPlanGroupVersion,
  PricingPage,
  BetaForm,

  // Invoices
  useInvoices,
  useInvoice,

  // Trial & Seats
  useTrialStatus,
  useSeatStatus,

  // Seat pricing utilities (per-seat billing calculations)
  calculateBillableSeats,
  calculateSeatOverageCents,
  calculateTotalSubscriptionCents,
  getPerSeatPriceCents,
  getSeatPricing,

  // Billing portal (opens Stripe portal — managed by SDK)
  useBillingPortal,

  // Quota Usage — client-side (uses the signed-in user's session)
  // For server-side secure usage recording, use useServerRecordUsage / route-handlers instead
  QuotaUsageContextProvider,
  useQuotaUsageContext,
  useRecordUsage,
  useQuotaUsageStatus,
  useAllQuotaUsage,
  useUsageLogs,
  invalidateQuotaUsage,

  // Quota Usage — conditional render
  WhenQuotaAvailable,
  WhenQuotaExhausted,
  WhenQuotaOverage,
  WhenQuotaThreshold,

  // Utilities — formatting & pricing display
  formatCents,
  formatOverageRate,
  formatOverageRateWithLabel,
  formatQuotaIncludedOverage,
  formatQuotaWithPrice,
  getQuotaDisplayValue,
  getQuotaDisplayWithVariant,
  getQuotaUnitLabelFromName,

  // Utilities — plan & pricing
  getPricingVariant,
  getBasePriceCents,
  getStripePriceIdForInterval,
  getQuotaOverageCents,
  getAvailableCurrenciesFromPlans,
  getDisplayCurrency,
  getBillingIntervalAndCurrencyFromPriceId,

  // Utilities — currency
  getCurrencySymbol,
  getCurrencyFlag,

  // Constants — currency
  CURRENCY_DISPLAY,
  CURRENCY_FLAG,
  PLAN_CURRENCY_CODES,
  PLAN_CURRENCY_OPTIONS,

  // Low-level API classes (advanced use)
  BaseApi,
  UserApi,
  WorkspaceApi,
  SettingsApi,

  // Push Notifications
  usePushNotifications,

  // i18n
  useTranslation,
  SUPPORTED_LOCALES,

  // Permissions
  WhenPermission,
  usePermissions,

  // Settings screens constant
  SETTINGS_SCREENS,
  // ─────────────────────────────────────────────────────────────────────────
} from "@buildbase/sdk/react";

// Some runtime exports still live on the root SDK entrypoint in this version.
export { ApiVersion, eventEmitter } from "@buildbase/sdk";

// Re-export types from @buildbase/sdk/react
export type {
  // Events
  EventData,
  EventType,
  OnWorkspaceChangeParams,
  UserCreatedEventData,
  UserUpdatedEventData,
  WorkspaceChangedEventData,
  WorkspaceCreatedEventData,
  WorkspaceDeletedEventData,
  WorkspaceUpdatedEventData,
  WorkspaceUserAddedEventData,
  WorkspaceUserRemovedEventData,
  WorkspaceUserRoleChangedEventData,

  // Subscription & Plans
  BillingInterval,
  ISubscription,
  ISubscriptionItem,
  ISubscriptionResponse,
  ISubscriptionUpdateRequest,
  ISubscriptionUpdateResponse,
  IPlan,
  IPlanVersion,
  IPlanVersionSummary,
  IPlanVersionWithPlan,
  PlanVersionWithPricingVariants,
  IPlanGroup,
  IPlanGroupLatestVersion,
  IPlanGroupVersion,
  IPlanGroupVersionWithPlans,
  IPlanGroupInfo,
  IPlanGroupResponse,
  IPricingVariant,
  IBasePricing,
  IStripePricesByInterval,
  IQuotaByInterval,
  IQuotaIntervalValue,
  IQuotaOveragesByInterval,
  IQuotaOveragePriceIdsByInterval,
  SubscriptionContextValue,

  // Public pricing
  IPublicPlanItem,
  IPublicPlanItemCategory,
  IPublicPlanVersion,
  IPublicPlansResponse,
  PricingPageDetails,
  PricingPageProps,

  // Checkout & Invoices
  ICheckoutSessionRequest,
  ICheckoutSessionResponse,
  IInvoice,
  IInvoiceResponse,
  IInvoiceListResponse,
  InvoiceStatus,

  // Quota Usage
  IRecordUsageRequest,
  IRecordUsageResponse,
  IQuotaUsageStatus,
  IQuotaUsageStatusResponse,
  IAllQuotaUsageResponse,
  IUsageLogEntry,
  IUsageLogsQuery,
  IUsageLogsResponse,
  QuotaUsageContextValue,
  QuotaDisplayValue,
  QuotaDisplayWithOverage,
  FormatQuotaWithPriceOptions,

  // Utilities
  IBaseApiConfig,

  // Trial & Seats
  TrialStatus,
  SeatStatus,
  CheckoutResult,

  // i18n
  // TranslationKey,

  // Notifications,
  NotificationData,
  NotificationResult,
  NotificationEvent,
  // ─────────────────────────────────────────────────────────────────────────
} from "@buildbase/sdk/react";

// ─── Custom wrappers & server-side utilities ──────────────────────────────────

// Provider (wraps SaaSOSProvider with env config)
export * from "./provider/SaaSProvider";

// Types for SaaSProvider
export * from "./types";

// Token verification (OAuth code → sessionId for the frontend auth flow)
export * from "./token-verification";

// Token exchange (API token → sessionId for server-side usage recording)
export * from "./token-exchange";

// Server-side usage recording utilities (called by route-handlers internally)
export * from "./usage";

// Server-side session management (HttpOnly cookie — sessionId never reaches the browser)
export * from "./session";

// Auth hook wrapper
export * from "./hooks/useSDKAuth";
export type { UseSDKAuthReturn } from "./hooks/useSDKAuth";

// Server-side proxy usage hooks (call your app's BE routes, not buildbase directly)
// Named useServer* to distinguish from the SDK's built-in useRecordUsage / useAllQuotaUsage
export * from "./hooks/useUsage";

// Client-side limit check hook (reads from SubscriptionContextProvider)
export * from "./hooks/useLimitCheck";

// Client-side feature gate hook + FEATURE_STATES enum
export * from "./hooks/useFeatureGate";
export type { UseFeatureGateOptions, UseFeatureGateReturn, FeatureState } from "./hooks/useFeatureGate";

// Plan slug constants — shared source of truth for client and server
// Server-side (@buildbase/helpers/auth) re-exports from here to avoid duplication
export * from "./plan-slugs";
export type { PlanFeatureSlug, PlanLimitSlug, PlanQuotaSlug } from "./plan-slugs";
