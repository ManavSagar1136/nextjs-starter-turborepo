"use client";

import { useCallback } from "react";
import { useTanstackMutation } from "@buildbase/tanstack-query/hooks/use-tanstack-mutation";
import { API } from "@/services";

interface SubscribeNewsletterVariables {
  email: string;
  html?: {
    thankYouHTML?: string;
    infoHTML?: string;
  };
}

interface SubscribeNewsletterOptions {
  email: string;
  html?: {
    thankYouHTML?: string;
    infoHTML?: string;
  };
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Custom React hook that provides newsletter subscription logic.
 *
 * Returns `subscribe` function and loading/subscription state.
 *
 * @returns {Object} - The subscription interface.
 * @property {Function} subscribe - Call to start a newsletter subscription.
 * @property {boolean} isLoading - Whether a subscription request is pending.
 * @property {boolean} isSubscribed - Whether the subscription was successful.
 * @property {Function} reset - Resets mutation state.
 */
export const useSubscribeNewsletter = () => {
  /**
   * React Query mutation for newsletter subscription.
   */
  const mutation = useTanstackMutation({
    /**
     * Mutation function to perform the actual newsletter subscription request.
     * @param {SubscribeNewsletterVariables} param0 - The variables for subscription.
     * @returns {Promise<any>} The API response object.
     */
    mutationFn: async ({ email, html }: SubscribeNewsletterVariables) => {
      // Default HTML used in the newsletter emails if not provided.
      const defaultHtml = {
        thankYouHTML: "<p>Thank you for subscribing to our newsletter!</p>",
        infoHTML: "<p>Thank you for subscribing to our newsletter!</p>",
      };

      // Merge defaults with any provided html overrides.
      const finalHtml = html
        ? {
            thankYouHTML: html.thankYouHTML || defaultHtml.thankYouHTML,
            infoHTML: html.infoHTML || defaultHtml.infoHTML,
          }
        : defaultHtml;

      // Call the API endpoint to subscribe the user.
      const response = await API.public.subscribeToNewsletter({
        email,
        html: finalHtml,
      });

      return response;
    },
    toastProps: {
      success: {
        title: "Successfully subscribed!",
        description: "You've been added to our newsletter.",
      },
      error: {
        title: "Subscription failed",
        description: "Something went wrong. Please try again later.",
      },
    },
  });

  /**
   * Subscribes a user to the newsletter.
   *
   * @param {SubscribeNewsletterOptions} param0 - Options for subscription.
   */
  const subscribe = useCallback(
    async ({ email, html, onSuccess, onError }: SubscribeNewsletterOptions) => {
      if (!email) return;

      try {
        // Trigger the React Query mutation (which does the API call).
        await mutation.mutateAsync({ email, html });
        // If an onSuccess callback was provided, call it.
        onSuccess?.();
      } catch (error) {
        // If a custom error handler is provided, call it with the error.
        if (onError) {
          onError(
            error instanceof Error
              ? error
              : new Error(
                  error instanceof Error
                    ? error.message
                    : "Something went wrong. Please try again later.",
                ),
          );
        }
      }
    },
    [mutation],
  );

  /**
   * Resets the mutation state.
   */
  const reset = useCallback(() => {
    mutation.reset();
  }, [mutation]);

  // Hook API - exposes functions and state to consumers.
  return {
    subscribe, // Subscribe function to call
    isLoading: mutation.isPending, // Whether a request is ongoing
    isSubscribed: mutation.isSuccess, // Whether the last request succeeded
    reset, // Reset mutation state
  };
};
