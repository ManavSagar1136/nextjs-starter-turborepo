// Re-export all functionalities from @buildbase/sdk
export {
  // Core Provider and Types
  ApiVersion,
  SaaSOSProvider,
  SubscriptionContextProvider,

  // Components
  WhenAuthenticated,
  WhenUnauthenticated,
  WhenRoles,
  WhenWorkspaceRoles,
  WhenWorkspaceFeatureDisabled,
  WhenWorkspaceFeatureEnabled,
  WhenUserFeatureEnabled,
  WhenUserFeatureDisabled,
  PricingPage,
  // Subscription HOCs
  WhenSubscription,
  WhenNoSubscription,
  WhenSubscriptionToPlans,

  // Hooks
  useSaaSAuth,
  useSaaSWorkspaces,
  useUserFeatures,
  // Subscription Hooks
  useSubscriptionContext,
  useSubscription,
  useSubscriptionManagement,
  usePlanGroup,
  usePlanGroupVersions,
  usePublicPlans,
  usePublicPlanGroupVersion,
  useInvoices,
  useInvoice,
  useCreateCheckoutSession,
  useUpdateSubscription,

  // Workspace
  WorkspaceSwitcher,
} from "@buildbase/sdk";

// Re-export types from @buildbase/sdk
export type {
  EventData,
  EventType,
  UserCreatedEventData,
  UserUpdatedEventData,
  WorkspaceChangedEventData,
  WorkspaceCreatedEventData,
  WorkspaceDeletedEventData,
  WorkspaceUpdatedEventData,
  WorkspaceUserAddedEventData,
  WorkspaceUserRemovedEventData,
  WorkspaceUserRoleChangedEventData,
  // Public pricing types
  BillingInterval,
  IPublicPlanItem,
  IPublicPlanVersion,
  PricingPageDetails,
  PricingPageProps,
} from "@buildbase/sdk";

// Export our custom wrapper and utilities
export * from "./provider/SaaSProvider";
export * from "./types";
export * from "./token-verification";
export * from "./hooks/useSDKAuth";
export type { UseSDKAuthReturn } from "./hooks/useSDKAuth";
