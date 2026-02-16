import { env } from "@buildbase/env";

/**
 * Check if the product is publicly launched
 * @returns true if product is launched, false otherwise
 */
export const isProductLaunched = (): boolean => {
  return env.NEXT_PUBLIC_PRODUCT_LAUNCHED === "true";
};
