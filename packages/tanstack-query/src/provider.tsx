"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";
import { isDevelopment } from "@buildbase/env";

interface TanStackQueryProviderProps {
  children: ReactNode;
}

export const TanStackQueryProvider = ({ children }: TanStackQueryProviderProps) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
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
