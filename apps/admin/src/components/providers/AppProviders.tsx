"use client";

import { ThemeProvider } from "@buildbase/ui/components/providers/ThemeProvider";
import SaaSProvider from "./SaaSProvider";
import type { ReactNode } from "react";

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * AppProviders - Wraps all application-level providers for Admin app
 *
 * This component consolidates all provider setup to keep the layout file clean.
 * It includes:
 * - ThemeProvider: Theme management (light/dark mode)
 * - SaaSProvider: Buildbase SDK authentication
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <SaaSProvider>{children}</SaaSProvider>
    </ThemeProvider>
  );
}
