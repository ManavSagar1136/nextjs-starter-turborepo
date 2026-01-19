/**
 * Admin app configuration
 * Extends shared config with app-specific computed values
 */

import { SiteConfig as SharedConfig } from "@buildbase/utils/config";

/**
 * Admin app site configuration
 * Includes shared config plus app-specific computed values
 */
export const SiteConfig = {
  ...SharedConfig,
  // App-specific computed values
  baseUrl: SharedConfig.adminAppUrl,
  serverUrl: `${SharedConfig.adminAppUrl}/api`,
};
