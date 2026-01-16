/**
 * A centralized collection of image asset paths used throughout the application.
 *
 * @remarks
 * The `IMAGES` object is structured into logical sections representing different UI features
 * or fallbacks. All paths are relative to the public assets directory and are marked `as const`
 * for strong type inference.
 */
export const IMAGES = {
  /**
   * Image fallbacks for various scenarios.
   */
  IMAGE_FALLBACK: {
    NOT_FOUND: "/images/image-not-found.jpg",
  },
  /**
   * Data fallbacks for various scenarios.
   */
  DATA_FALLBACK: {
    NOT_FOUND: "/icon/images/data-error.svg",
    EMPTY: "/icon/images/data-empty.svg",
  },
} as const;
