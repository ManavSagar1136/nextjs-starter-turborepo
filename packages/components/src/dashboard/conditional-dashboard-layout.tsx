"use client";

import { usePathname } from "next/navigation";
import { DashboardLayout } from "./dashboard-layout";
import type { DashboardLayoutComponentProps } from "./dashboard-layout";

interface ConditionalDashboardLayoutProps extends DashboardLayoutComponentProps {
  /**
   * Routes that should NOT have the dashboard layout
   * @default ['/login']
   */
  excludeRoutes?: string[];
}

/**
 * Conditionally applies DashboardLayout based on the current route
 * Routes in excludeRoutes will render children without the dashboard layout
 *
 * This component can create logout handlers client-side, avoiding the need
 * to pass functions from server components.
 */
export function ConditionalDashboardLayout({
  excludeRoutes = ["/login"],
  children,
  ...dashboardProps
}: ConditionalDashboardLayoutProps) {
  const pathname = usePathname();
  const shouldExclude = excludeRoutes.some(route => pathname === route || pathname.startsWith(route + "/"));

  if (shouldExclude) {
    return <>{children}</>;
  }

  return <DashboardLayout {...dashboardProps}>{children}</DashboardLayout>;
}
