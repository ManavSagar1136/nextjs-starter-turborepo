"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { NotLoggedIn } from "@buildbase/components";
import { useSDKAuth } from "@/hooks/useSDKAuth";
import { Routes } from "@/data/routes";

const LoginPage = () => {
  const { isAuthenticated, isLoading, signIn } = useSDKAuth();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected.current || isLoading) {
      return;
    }

    // Only redirect if we're sure the user is authenticated
    if (isAuthenticated) {
      hasRedirected.current = true;
      router.replace(Routes.dashboard);
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLoginClick = () => {
    signIn();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <div className="border-primary h-4 w-4 animate-spin rounded-full border-b-2"></div>
          Loading...
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <NotLoggedIn onLoginClick={handleLoginClick} />
      </div>
    </div>
  );
};

export default LoginPage;
