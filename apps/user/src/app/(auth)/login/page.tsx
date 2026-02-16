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
    if (hasVerified.current && verifiedAuth !== null) return;

    // Reset verification state if we're re-verifying after a failed attempt
    if (hasVerified.current && verifiedAuth === false) {
      hasVerified.current = false;
    }

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
        setVerifiedAuth(false);
        hasRedirected.current = false; // Reset redirect flag to prevent loops
        try {
          await signOut();
        } catch (signOutError) {
          // Ignore signOut errors
        }
      }
    } catch (error: any) {
      // On any error, assume not authenticated to break potential loops
      // This forces a fresh login which will get a proper token
      setVerifiedAuth(false);
      hasRedirected.current = false; // Reset redirect flag to prevent loops

      try {
        await signOut();
      } catch (signOutError) {
        // Ignore signOut errors
      }
    } finally {
      setIsVerifying(false);
    }
  }, [signOut, verifiedAuth]);

  useEffect(() => {
    // When SDK says authenticated but we haven't verified with server yet
    // Also re-verify if SDK says authenticated but server said not authenticated (to handle cookie updates)
    if (!isLoading && isAuthenticated && !isVerifying) {
      if (verifiedAuth === null || verifiedAuth === false) {
        verifyServerAuth();
      }
    }

    // If SDK says not authenticated, reset verification state
    if (!isLoading && !isAuthenticated) {
      if (verifiedAuth !== null) {
        setVerifiedAuth(null);
        hasVerified.current = false;
        hasRedirected.current = false;
      }
    }
  }, [isAuthenticated, isLoading, verifiedAuth, isVerifying, verifyServerAuth]);

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected.current || isLoading || isVerifying) {
      return;
    }

    // Only redirect if both SDK and server verify authentication
    // verifiedAuth === true means server confirmed, verifiedAuth === null means not checked yet
    // Never redirect if verifiedAuth === false (server said not authenticated)
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
