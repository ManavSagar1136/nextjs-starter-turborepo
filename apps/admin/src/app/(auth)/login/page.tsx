"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { NotLoggedIn } from "@buildbase/components";
import { useSDKAuth } from "@/hooks/useSDKAuth";
import { Routes } from "@/data/routes";
import { API } from "@/services";

const LoginPage = () => {
  const { isAuthenticated, isLoading, signIn, signOut } = useSDKAuth();
  const router = useRouter();
  const hasRedirected = useRef(false);
  const hasVerified = useRef(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedAuth, setVerifiedAuth] = useState<boolean | null>(null);

  // Verify server-side auth status to prevent redirect loops
  // This handles the case where SDK thinks user is authenticated but server cookie is invalid
  const verifyServerAuth = useCallback(async () => {
    if (hasVerified.current) return;
    hasVerified.current = true;
    setIsVerifying(true);

    try {
      // Check if server session is valid by calling the session endpoint
      // This endpoint validates the HTTP-only cookie on the server
      const session = await API.auth.getSession();

      if (session.authenticated) {
        // Server confirmed we're authenticated
        setVerifiedAuth(true);
      } else {
        // Server says we're not authenticated - clear SDK state
        console.log("[LoginPage] Server session invalid, clearing SDK auth state");
        setVerifiedAuth(false);
        await signOut();
      }
    } catch (error) {
      console.error("[LoginPage] Error verifying server auth:", error);
      // On error, trust the SDK state
      setVerifiedAuth(isAuthenticated);
    } finally {
      setIsVerifying(false);
    }
  }, [signOut, isAuthenticated]);

  useEffect(() => {
    // When SDK says authenticated but we haven't verified with server yet
    if (!isLoading && isAuthenticated && verifiedAuth === null && !isVerifying) {
      verifyServerAuth();
    }
  }, [isAuthenticated, isLoading, verifiedAuth, isVerifying, verifyServerAuth]);

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected.current || isLoading || isVerifying) {
      return;
    }

    // Only redirect if both SDK and server verify authentication
    // verifiedAuth === true means server confirmed, verifiedAuth === null means not checked yet
    if (isAuthenticated && verifiedAuth === true) {
      hasRedirected.current = true;
      router.replace(Routes.dashboard);
    }
  }, [isAuthenticated, isLoading, isVerifying, verifiedAuth, router]);

  const handleLoginClick = () => {
    signIn();
  };

  // Show loading while SDK is loading OR while verifying server auth
  if (isLoading || isVerifying || (isAuthenticated && verifiedAuth === null)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <div className="border-primary h-4 w-4 animate-spin rounded-full border-b-2"></div>
          Loading...
        </div>
      </div>
    );
  }

  // If verified as authenticated, show nothing (will redirect)
  if (isAuthenticated && verifiedAuth === true) {
    return null;
  }

  // Show login form - either not authenticated, or server said we're not authenticated
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <NotLoggedIn onLoginClick={handleLoginClick} />
      </div>
    </div>
  );
};

export default LoginPage;
