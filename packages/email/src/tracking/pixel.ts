/**
 * @buildbase/email - Tracking Pixel
 * Insert tracking pixel for open tracking
 */

/**
 * Create a 1x1 transparent tracking pixel HTML
 */
export function createTrackingPixel(trackingId: string, baseUrl: string): string {
  const pixelUrl = `${baseUrl}/api/track/open/${trackingId}`;
  return `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;border:0;width:1px;height:1px;" />`;
}

/**
 * Insert tracking pixel into HTML content
 * Places pixel at the end of the body for best compatibility
 */
export function insertTrackingPixel(html: string, trackingId: string, baseUrl: string): string {
  if (!baseUrl || !trackingId) {
    return html;
  }

  const pixel = createTrackingPixel(trackingId, baseUrl);

  // Insert before </body> if exists, otherwise append
  if (html.toLowerCase().includes("</body>")) {
    return html.replace(/<\/body>/i, `${pixel}</body>`);
  }

  // If no body tag, append to end
  return html + pixel;
}

/**
 * Remove tracking pixel from HTML (for previews, etc.)
 */
export function removeTrackingPixel(html: string): string {
  // Remove our tracking pixels by pattern
  return html.replace(/<img[^>]*\/api\/track\/open\/[^>]*>/gi, "");
}

/**
 * Generate a 1x1 transparent GIF as buffer
 * Used by the tracking endpoint to return a valid image
 */
export function getTransparentPixel(): Buffer {
  // 1x1 transparent GIF (43 bytes)
  return Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
}
