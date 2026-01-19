/**
 * Browser utility functions
 */

interface ShareContentOptions {
  title: string;
  text?: string;
  url?: string;
}

/**
 * Shares content using the Web Share API if available,
 * otherwise falls back to copying the URL to clipboard.
 */
export const shareContent = async (options: ShareContentOptions): Promise<void> => {
  const { title, text, url } = options;
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");

  // Check if Web Share API is available
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title,
        text: text || "",
        url: shareUrl,
      });
      return;
    } catch (error) {
      // User cancelled or error occurred, fall through to clipboard
      if ((error as Error).name === "AbortError") {
        return; // User cancelled, don't show error
      }
    }
  }

  // Fallback: Copy URL to clipboard
  if (typeof window !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(shareUrl);
      // Optionally show a toast notification here
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  }
};
