/**
 * Check if the product is publicly launched
 * @returns true if product is launched, false otherwise
 */
export const isProductLaunched = (): boolean => {
  return process.env.NEXT_PUBLIC_PRODUCT_LAUNCHED === "true";
};
