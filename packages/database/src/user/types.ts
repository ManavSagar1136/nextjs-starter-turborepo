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
  [key: string]: any;
}
