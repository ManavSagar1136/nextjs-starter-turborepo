"use client";

import { useState } from "react";
import { SiteConfig } from "@/config";

import { useIsLogged } from "./use-is-logged-in";

export const useGetStarted = () => {
  const { user, isLogged, isLoading: isLoginLoading, isAdmin } = useIsLogged();
  const [isLoadingCta, setLoading] = useState(false);
  
  const onGetStartedClick = () => {
    setLoading(true);
    // For public app, always redirect to user app URL
    // The user app will handle authentication and routing
    window.location.href = SiteConfig.userAppUrl;
  };

  return {
    isLogged,
    isLoginLoading,
    isLoadingCta,
    onGetStartedClick,
    user,
    isAdmin,
  };
};
