"use client";

import { ThemeProvider } from "@buildbase/ui/components/providers/ThemeProvider";
import { DialogProvider } from "@buildbase/dialog-manager/provider";
import SaaSProvider from "./SaaSProvider";
import { InitializeDialogs } from "@/dialogs/initialize";
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
 * - DialogProvider: Dialog management system
 * - SaaSProvider: Buildbase SDK authentication
 * - InitializeDialogs: Initializes dialog system
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <DialogProvider>
        <SaaSProvider>
          <div>
            <InitializeDialogs />
            {children}
          </div>
        </SaaSProvider>
      </DialogProvider>
    </ThemeProvider>
  );
}
