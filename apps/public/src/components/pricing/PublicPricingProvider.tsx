"use client";

import { SaaSProvider } from "@buildbase/saas-sdk";
import type { ReactNode } from "react";

interface PublicPricingProviderProps {
  children: ReactNode;
}

/**
 * PublicPricingProvider
 *
 * Wraps the pricing section with SaaSOSProvider context, which is required
 * by the @buildbase/sdk hooks (usePublicPlans, usePublicPlanGroupVersion etc.).
 *
 * This is scoped to just the /pricing route so the rest of the public site
 * doesn't carry the SDK overhead.
 *
 * No auth callbacks are needed here — the pricing page only reads public plan data.
 */
export function PublicPricingProvider({ children }: PublicPricingProviderProps) {
  return (
    <SaaSProvider
      // No redirectUrl or auth callbacks needed for public plan reading
      redirectUrl=''
      getSession={async () => null}
    >
      {children}
    </SaaSProvider>
  );
}
