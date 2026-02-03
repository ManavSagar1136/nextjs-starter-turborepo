"use client";

import { useState } from "react";
import { API } from "@/services";

interface NewsletterValues {
  email: string;
}

/**
 * Hook for subscribing to newsletter
 * Email templates are handled server-side
 */
export default function useSendNewsletterEmail() {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const sendNewsletterEmail = async (
    values: NewsletterValues,
    onSuccess: () => void,
    onError: () => void,
  ) => {
    setIsLoading(true);

    try {
      const response = await API.public.subscribeToNewsletter({
        email: values.email,
      });
      console.log("[Newsletter] Subscribe response:", response);
      onSuccess();
    } catch (error) {
      console.error("[Newsletter] Error subscribing:", error);
      onError();
    } finally {
      setIsLoading(false);
    }
  };

  return { sendNewsletterEmail, isLoading };
}
