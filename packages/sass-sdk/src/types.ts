/**
 * SaaS Provider Props
 */
export interface SaaSProviderProps {
  children: React.ReactNode;
  /**
   * Redirect URL for authentication callback
   */
  redirectUrl: string;
  /**
   * Called when user signs out
   * @returns void or Promise<void>
   */
  onSignOut?: () => void | Promise<void>;

  /**
   * Handles authentication code from SDK
   * @param code - Authentication code from SDK
   * @returns Promise with sessionId
   */
  handleAuthentication?: (code: string) => Promise<{ sessionId: string }>;

  /**
   * Handles SDK events (workspace changes, user events, etc.)
   * @param eventType - Type of event
   * @param data - Event data
   * @returns void or Promise<void>
   */
  handleEvent?: (eventType: string, data: any) => void | Promise<void>;
}
