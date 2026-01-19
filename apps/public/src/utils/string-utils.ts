/**
 * Capitalizes the first letter of a given string.
 *
 * @param text - The input string.
 * @returns A new string with the first letter converted to uppercase.
 *
 * @example
 * ```ts
 * capitalizeFirstLetter("hello"); // "Hello"
 * capitalizeFirstLetter("world"); // "World"
 * capitalizeFirstLetter("");      // ""
 * ```
 */
export function capitalizeFirstLetter(text: string): string {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}
