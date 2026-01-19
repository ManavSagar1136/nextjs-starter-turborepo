"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { cn } from "../../lib/utils";

const DEFAULT_POLLING_DELAY = 3000;
const DEFAULT_MAX_POLLING_LIMIT = 15;

export type PollingFunction = () => boolean | Promise<boolean>;

/**
 * Props for the ConditionalPolling component.
 */
export interface ConditionalPollingProps {
  /**
   * The function to check whether the polling condition is satisfied.
   * Should return a boolean or a Promise that resolves to a boolean.
   * Returning `true` will stop polling and close the overlay.
   */
  conditionFn: PollingFunction;

  /**
   * The delay (milliseconds) between each polling attempt.
   * @default DEFAULT_POLLING_DELAY
   */
  delay?: number;

  /**
   * The maximum number of polling attempts before giving up.
   * @default DEFAULT_MAX_POLLING_LIMIT
   */
  maxPollingLimit?: number;

  /**
   * Additional class names for the root component.
   */
  className?: string;

  /**
   * Title to display in the polling overlay.
   */
  title?: string;

  /**
   * Description text to display in the polling overlay.
   */
  description?: string;
}

/**
 * ConditionalPolling Component
 *
 * This component renders a fullscreen loading overlay that repeatedly polls a specified condition
 * (usually an async backend state or action completion) until it is satisfied, an error is encountered,
 * or a maximum number of polling attempts is reached.
 *
 * While polling, a loader is shown. When the condition becomes true, the overlay hides itself.
 * If polling fails or the limit is reached, an error/limit message is shown.
 *
 * @param conditionFn - The polling function, resolves to true when condition is met.
 * @param delay - The delay between polling attempts in milliseconds.
 * @param maxPollingLimit - Maximum polling attempts before giving up.
 * @param className - Custom class names for the overlay.
 * @param title - Optional title text.
 * @param description - Optional description text.
 */
const ConditionalPolling: React.FC<ConditionalPollingProps> = ({
  conditionFn,
  delay = DEFAULT_POLLING_DELAY,
  maxPollingLimit = DEFAULT_MAX_POLLING_LIMIT,
  className,
  title,
  description,
}) => {
  // True if the polling condition is satisfied; hides the overlay.
  const [isConditionSatisfied, setIsConditionSatisfied] = React.useState(false);
  // True if polling is currently in progress.
  const [isPolling, setIsPolling] = React.useState(false);
  // True if an error occurred during polling.
  const [hasError, setHasError] = React.useState(false);
  // True if the polling attempt limit was reached.
  const [isLimitReached, setIsLimitReached] = React.useState(false);

  // Ref to keep track of polling call counts across re-renders.
  const pollingCountRef = React.useRef(0);
  // Ref to store the timeout ID so it can be cleaned up.
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  /**
   * Performs a single polling attempt by invoking conditionFn.
   * Handles state for success, failure, and limit reached.
   */
  const poll = React.useCallback(async () => {
    try {
      setIsPolling(true);
      const result = await conditionFn();

      if (result) {
        setIsConditionSatisfied(true);
        setIsPolling(false);
        return;
      }

      pollingCountRef.current += 1;

      if (pollingCountRef.current >= maxPollingLimit) {
        setIsLimitReached(true);
        setIsPolling(false);
        return;
      }

      timeoutRef.current = setTimeout(() => {
        poll();
      }, delay);
    } catch (_error) {
      setHasError(true);
      setIsPolling(false);
    }
  }, [conditionFn, delay, maxPollingLimit]);

  /**
   * Effect that starts polling on mount and cleans up on unmount or dependency change.
   * Also resets state.
   */
  React.useEffect(() => {
    // Reset polling state every mount/restart
    pollingCountRef.current = 0;
    setIsConditionSatisfied(false);
    setIsLimitReached(false);
    setHasError(false);

    // Start polling
    poll();

    // Cleanup polling timer when component unmounts/changes
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [poll]);

  // If the condition was met, render nothing (i.e., hide overlay)
  if (isConditionSatisfied) {
    return null;
  }

  // Render polling/fullscreen overlay UI
  return (
    <div
      className={cn(
        "absolute inset-0 z-50 flex items-center justify-center p-4",
        "bg-background/80 backdrop-blur-sm",
        className
      )}
    >
      <div
        className={cn(
          "w-full max-w-md rounded-2xl border p-4 shadow-xl sm:p-6",
          "bg-background/95 backdrop-blur-sm",
          hasError && "border-red-500/40 bg-red-50/95 dark:bg-red-950/95",
          isPolling && "border-blue-500/40 bg-blue-50/95 dark:bg-blue-950/95",
          isLimitReached && "border-amber-500/40 bg-amber-50/95 dark:bg-amber-950/95"
        )}
      >
        <div className="flex flex-col items-center gap-3 text-center sm:gap-4">
          {/* Loader icon with appropriate color based on polling state */}
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:h-14 sm:w-14",
              hasError && "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400",
              isPolling && "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
              isLimitReached && "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400"
            )}
          >
            <Loader2 className={cn("h-6 w-6 sm:h-7 sm:w-7", isPolling && "animate-spin")} />
          </div>

          {/* Title and description/message area */}
          <div className="flex w-full flex-col gap-2">
            {title && (
              <h3 className="text-foreground text-base font-semibold sm:text-lg">
                {hasError ? "Something went wrong" : isLimitReached ? "Polling limit reached" : title}
              </h3>
            )}

            {description && (
              <p className="text-muted-foreground px-2 text-sm leading-relaxed sm:text-base">
                {hasError
                  ? "An error occurred while checking the condition. Please try again."
                  : isLimitReached
                    ? "The maximum number of polling attempts has been reached. Please refresh or try again later."
                    : description}
              </p>
            )}

            {!title && !description && (
              <p className="text-foreground text-sm font-medium sm:text-base">
                {hasError ? "Something went wrong" : isLimitReached ? "Polling limit reached" : "Checking..."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

ConditionalPolling.displayName = "ConditionalPolling";

export default ConditionalPolling;
