/**
 * Public app configuration
 * Extends shared config with app-specific computed values
 */

import { SiteConfig as SharedConfig } from "@buildbase/utils/config";

/**
 * Public app site configuration
 * Includes shared config plus app-specific computed values
 */
export const SiteConfig = {
  ...SharedConfig,
  // App-specific computed values
  baseUrl: SharedConfig.publicAppUrl,
  serverUrl: `${SharedConfig.publicAppUrl}/api`,
};
