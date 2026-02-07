"use client";

import { useCallback } from "react";
import { useTanstackMutation } from "@buildbase/tanstack-query/hooks/use-tanstack-mutation";
import { API } from "@/services";

interface SubscribeNewsletterOptions {
  email: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Custom React hook that provides newsletter subscription logic.
 * Email templates are handled server-side.
 *
 * @returns {Object} - The subscription interface.
 * @property {Function} subscribe - Call to start a newsletter subscription.
 * @property {boolean} isLoading - Whether a subscription request is pending.
 * @property {boolean} isSubscribed - Whether the subscription was successful.
 * @property {Function} reset - Resets mutation state.
 */
export const useSubscribeNewsletter = () => {
  const mutation = useTanstackMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const response = await API.public.subscribeToNewsletter({ email });
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

  const subscribe = useCallback(
    async ({ email, onSuccess, onError }: SubscribeNewsletterOptions) => {
      if (!email) return;

      try {
        await mutation.mutateAsync({ email });
        onSuccess?.();
      } catch (error) {
        if (onError) {
          onError(
            error instanceof Error
              ? error
              : new Error("Something went wrong. Please try again later."),
          );
        }
      }
    },
    [mutation],
  );

  const reset = useCallback(() => {
    mutation.reset();
  }, [mutation]);

  return {
    subscribe,
    isLoading: mutation.isPending,
    isSubscribed: mutation.isSuccess,
    reset,
  };
};
