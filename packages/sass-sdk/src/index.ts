// Re-export all functionalities from @buildbase/sdk
export {
  // Core Provider and Types
  ApiVersion,
  SaaSOSProvider,

  // Components
  WhenAuthenticated,
  WhenUnauthenticated,
  WhenRoles,
  WhenWorkspaceRoles,
  WhenWorkspaceFeatureDisabled,
  WhenWorkspaceFeatureEnabled,
  WhenUserFeatureEnabled,
  WhenUserFeatureDisabled,

  // Hooks
  useSaaSAuth,

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
} from "@buildbase/sdk";

// Export our custom wrapper and utilities
export * from "./provider/SaaSProvider";
export * from "./types";
export * from "./token-verification";
export * from "./hooks/useSDKAuth";
export type { UseSDKAuthReturn } from "./hooks/useSDKAuth";
