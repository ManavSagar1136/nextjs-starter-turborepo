/**
 * @buildbase/email - Tracking Module
 * Email open and click tracking
 */

// Export types
export type {
  TrackingConfig,
  TrackingContext,
  EmailEventType,
  EmailEvent,
  EmailMetrics,
  TrackingRequestInfo,
} from "./types.js";

export { DEFAULT_TRACKING_CONFIG } from "./types.js";

// Export pixel utilities
export { createTrackingPixel, insertTrackingPixel, removeTrackingPixel, getTransparentPixel } from "./pixel.js";

// Export link rewriting
export { createClickTrackingUrl, rewriteLinks, restoreOriginalLinks, extractLinks } from "./link-rewriter.js";

// Export tracking service
export { TrackingService, getTrackingService } from "./tracking.service.js";
