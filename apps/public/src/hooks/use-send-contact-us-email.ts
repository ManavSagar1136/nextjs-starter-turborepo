"use client";

import { useState } from "react";
import { API } from "@/services";

interface ContactFormValues {
  email: string;
  firstName?: string;
  lastName?: string;
  contactNumber?: string;
  message: string;
  subject?: string;
}

/**
 * Hook for submitting contact form
 * Email templates are handled server-side
 */
export default function useSendContactUsEmail() {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const sendContactUsEmail = async (
    values: ContactFormValues,
    onSuccess: () => void,
    onError: () => void,
  ) => {
    setIsLoading(true);

    try {
      const response = await API.contact.sendContactUsEmail({
        firstName: values.firstName || "",
        lastName: values.lastName || "",
        contactNumber: values.contactNumber || "",
        email: values.email,
        message: values.message,
        subject: values.subject || `Contact form submission from ${values.email}`,
      });
      console.log("[Contact] Submit response:", response);
      onSuccess();
    } catch (error) {
      console.error("[Contact] Error submitting:", error);
      onError();
    } finally {
      setIsLoading(false);
    }
  };

  return { sendContactUsEmail, isLoading };
}
