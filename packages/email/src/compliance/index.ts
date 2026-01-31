/**
 * @buildbase/email - Compliance Module
 * Email compliance features (unsubscribe, headers)
 */

// Export types
export type { EmailPreferences, UnsubscribeToken, ComplianceHeaders } from "./types.js";

export { DEFAULT_PREFERENCES } from "./types.js";

// Export headers
export {
  generateMessageId,
  addComplianceHeaders,
  generateUnsubscribeUrl,
  generateOneClickUnsubscribeUrl,
} from "./headers.js";

// Export unsubscribe service
export { generateUnsubscribeToken, UnsubscribeService, getUnsubscribeService } from "./unsubscribe.js";
