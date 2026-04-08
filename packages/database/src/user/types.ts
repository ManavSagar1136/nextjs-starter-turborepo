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
  /** Feature flags from subscription plan e.g. { "api-access": true } */
  features?: Record<string, boolean>;
  /** Hard caps from subscription plan e.g. { "max-assets": 500, "max-api-keys": null } */
  limits?: Record<string, number | null>;
  [key: string]: any;
}
