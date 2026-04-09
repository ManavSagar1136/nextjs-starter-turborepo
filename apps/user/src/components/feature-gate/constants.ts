/**
 * Dialog keys for the feature gate system.
 * Registered in apps/user/src/dialogs/setup.ts.
 */
export const FEATURE_GATE_DIALOG_KEYS = {
  ACCESS_DENIED: "feature-access-denied",
} as const;

export type FeatureGateDialogKey = (typeof FEATURE_GATE_DIALOG_KEYS)[keyof typeof FEATURE_GATE_DIALOG_KEYS];
