import { useEffect, useState } from "react";

/**
 * The default debounce delay in milliseconds.
 */
const DEFAULT_DEBOUNCE_DELAY = 500;

/**
 * Hook to debounce a value. It takes a value and a delay, and returns the
 * debounced value. The delay is optional and defaults to 500ms.
 *
 * @param value The value to debounce.
 * @param delay The delay before the value is updated. Defaults to {@link DEFAULT_DEBOUNCE_DELAY}.
 */
export function useDebounce<T>(value: T, delay: number = DEFAULT_DEBOUNCE_DELAY): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
