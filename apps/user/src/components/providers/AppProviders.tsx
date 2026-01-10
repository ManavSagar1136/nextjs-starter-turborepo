"use client";

import { ThemeProvider } from "@buildbase/ui/components/providers/ThemeProvider";
import { ReduxProvider } from "@buildbase/redux/provider";
import { TanStackQueryProvider } from "@buildbase/tanstack-query/provider";
import { userReducer } from "@/store";
import SaaSProvider from "./SaaSProvider";
import type { ReactNode } from "react";

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * AppProviders - Wraps all application-level providers
 *
 * This component consolidates all provider setup to keep the layout file clean.
 * It includes:
 * - ThemeProvider: Theme management (light/dark mode)
 * - ReduxProvider: Redux state management with persistence
 * - TanStackQueryProvider: React Query for server state management
 * - SaaSProvider: Buildbase SDK authentication and workspace management
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ReduxProvider
        additionalReducers={{
          user: userReducer,
        }}
        persistConfig={{
          key: "user-app",
          whitelist: ["user"],
        }}
      >
        <TanStackQueryProvider>
          <SaaSProvider>{children}</SaaSProvider>
        </TanStackQueryProvider>
      </ReduxProvider>
    </ThemeProvider>
  );
}
