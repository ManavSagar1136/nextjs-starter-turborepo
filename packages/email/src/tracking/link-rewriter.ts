/**
 * @buildbase/email - Link Rewriter
 * Rewrite links for click tracking
 */

/**
 * Links to skip during rewriting
 */
const SKIP_PATTERNS = [
  /^#/, // Anchor links
  /^mailto:/i, // Email links
  /^tel:/i, // Phone links
  /^sms:/i, // SMS links
  /unsubscribe/i, // Unsubscribe links (keep as-is for compliance)
  /^javascript:/i, // JavaScript links
  /^data:/i, // Data URIs
];

/**
 * Check if a URL should be skipped for tracking
 */
function shouldSkipLink(url: string): boolean {
  return SKIP_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Create a click tracking URL
 */
export function createClickTrackingUrl(trackingId: string, originalUrl: string, baseUrl: string): string {
  const encoded = encodeURIComponent(originalUrl);
  return `${baseUrl}/api/track/click/${trackingId}?url=${encoded}`;
}

/**
 * Rewrite links in HTML for click tracking
 * Uses regex-based approach to avoid cheerio dependency
 */
export function rewriteLinks(html: string, trackingId: string, baseUrl: string): string {
  if (!baseUrl || !trackingId) {
    return html;
  }

  // Match <a> tags with href attribute
  // This regex handles most common cases including quotes and spaces
  const linkRegex = /<a\s+([^>]*?)href\s*=\s*(["'])([^"']*?)\2([^>]*)>/gi;

  return html.replace(linkRegex, (match, before, quote, href, after) => {
    // Skip special links
    if (shouldSkipLink(href)) {
      return match;
    }

    // Skip already-tracked links
    if (href.includes("/api/track/click/")) {
      return match;
    }

    // Create tracking URL
    const trackingUrl = createClickTrackingUrl(trackingId, href, baseUrl);

    // Preserve original URL in data attribute
    return `<a ${before}href=${quote}${trackingUrl}${quote} data-original-href=${quote}${href}${quote}${after}>`;
  });
}

/**
 * Restore original links from tracking URLs
 * Useful for previews or debugging
 */
export function restoreOriginalLinks(html: string): string {
  // Match tracking URLs and extract original
  const trackingUrlRegex = /\/api\/track\/click\/[^?]+\?url=([^"'\s&]+)/g;

  return html.replace(trackingUrlRegex, (_, encodedUrl) => {
    try {
      return decodeURIComponent(encodedUrl);
    } catch {
      return encodedUrl;
    }
  });
}

/**
 * Extract all links from HTML
 * Useful for debugging and testing
 */
export function extractLinks(html: string): string[] {
  const links: string[] = [];
  const linkRegex = /href\s*=\s*["']([^"']+)["']/gi;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    if (match[1]) {
      links.push(match[1]);
    }
  }

  return links;
}
