/**
 * Shared types for user service functions
 */

export interface SDKUserData {
  id: string;
  email?: string;
  name?: string;
  image?: string;
  role?: string;
  [key: string]: any;
}

export interface SDKWorkspaceData {
  id: string;
  name: string;
  image?: string;
  slug?: string;
  description?: string;
  role?: string; // User's role in this workspace
  /**
   * Buildbase subscription status. Authoritative signal for whether this workspace
   * has an active subscription or trial.
   * Values: 'active' | 'trialing' | 'canceled' | 'past_due' | 'paused' | 'incomplete' | 'unpaid'
   * null = no subscription has ever been created.
   */
  subscriptionStatus?: string | null;
  /** Feature flags from subscription plan e.g. { "api-access": true } */
  features?: Record<string, boolean> | null;
  /** Hard caps from subscription plan e.g. { "max-api-keys": 10, null = unlimited } */
  limits?: Record<string, number | null> | null;
  [key: string]: any;
}
