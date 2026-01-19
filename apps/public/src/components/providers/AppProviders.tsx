"use client";

import { ThemeProvider } from "@buildbase/ui/components/providers/ThemeProvider";
import { TanStackQueryProvider } from "@buildbase/tanstack-query/provider";
import type { ReactNode } from "react";

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * AppProviders - Wraps all application-level providers for Public app
 *
 * This component consolidates all provider setup to keep the layout file clean.
 * It includes:
 * - ThemeProvider: Theme management (light/dark mode)
 * - TanStackQueryProvider: React Query for server state management
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TanStackQueryProvider>
        {children}
      </TanStackQueryProvider>
    </ThemeProvider>
  );
}
