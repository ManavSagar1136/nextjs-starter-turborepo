"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";
import { isDevelopment } from "@buildbase/env";

interface TanStackQueryProviderProps {
  children: ReactNode;
}

/**
 * TanStackQueryProvider - Provides TanStack Query (React Query) context
 *
 * Features:
 * - Pre-configured QueryClient with sensible defaults
 * - SSR-safe QueryClient creation using useState
 * - React Query DevTools in development mode
 * - Smart retry logic (doesn't retry on 4xx errors)
 * - Automatic refetch on reconnect
 */
export const TanStackQueryProvider = ({ children }: TanStackQueryProviderProps) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid refetching immediately on the client
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors (client errors)
              if (error instanceof Error && "status" in error) {
                const status = (error as any).status;
                if (status >= 400 && status < 500) {
                  return false;
                }
              }
              // Retry up to 3 times for other errors (network, 5xx, etc.)
              return failureCount < 3;
            },
            refetchOnWindowFocus: false, // Disable refetch on window focus
            refetchOnReconnect: true, // Refetch when reconnecting to internet
          },
          mutations: {
            retry: 1, // Retry mutations once on failure
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {isDevelopment() && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};
