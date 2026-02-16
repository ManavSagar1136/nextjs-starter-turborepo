"use client";

import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@buildbase/ui/components/ui/sidebar";
import { Separator } from "@buildbase/ui/components/ui/separator";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { DashboardBreadcrumb } from "./dashboard-breadcrumb";
import { AppIcon } from "../common/AppIcon";
import { ThemeToggle } from "@buildbase/ui/components/ui/theme-toggle";
import { WorkspaceSwitcher } from "./workspace-switcher";
import type { DashboardLayoutProps } from "./types";

export interface DashboardLayoutComponentProps extends DashboardLayoutProps {
  /**
   * Profile route path
   */
  profileRoute: string;
  /**
   * Optional custom logout handler
   * If provided, this will be used instead of the SDK's signOut
   * Otherwise, the SDK's signOut will be used (which triggers onSignOut callback in SaaSProvider)
   */
  onLogout?: () => Promise<void>;
  /**
   * Optional className for the sidebar
   */
  sidebarClassName?: string;
  /**
   * Optional className for the main content area
   */
  contentClassName?: string;
}

/**
 * Main dashboard layout component with sidebar navigation and breadcrumbs
 *
 * @example
 * ```tsx
 * <DashboardLayout
 *   menuItems={[
 *     {
 *       title: "Overview",
 *       url: "#",
 *       items: [
 *         { title: "Dashboard", url: "/dashboard", icon: LayoutIcon },
 *       ],
 *     },
 *   ]}
 *   breadcrumbExcludeSegments={['/user']}
 *   profileRoute="/dashboard/profile"
 * >
 *   <YourPageContent />
 * </DashboardLayout>
 * ```
 */
export function DashboardLayout({
  menuItems,
  breadcrumbExcludeSegments = [],
  showTeamSwitcher = false,
  brand,
  children,
  className,
  sidebarClassName,
  contentClassName,
  profileRoute,
  onLogout,
}: DashboardLayoutComponentProps) {
  return (
    <SidebarProvider>
      <Sidebar variant="inset" className={sidebarClassName}>
        <SidebarHeader>
          <div className="flex items-center justify-between gap-2">
            {brand && (
              <SidebarMenu className="flex-1">
                <SidebarMenuItem>
                  <SidebarMenuButton size="lg" asChild>
                    <Link href={brand.href} className="flex items-center gap-2">
                      <AppIcon size="xs" />
                      <span className="text-sm font-bold">{brand.text}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            )}
          </div>
        </SidebarHeader>
        <SidebarContent>
          {showTeamSwitcher && (
            <div className="border-b px-2 py-2">
              <WorkspaceSwitcher />
            </div>
          )}
          <NavMain items={menuItems} />
        </SidebarContent>
        <SidebarFooter>
          <ThemeToggle />
          <NavUser profileRoute={profileRoute} onLogout={onLogout} />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className={contentClassName || "flex h-[calc(100dvh-theme(spacing.14))] flex-col overflow-hidden"}>
        <header className="flex shrink-0 items-center gap-1.5 border-b p-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <DashboardBreadcrumb excludeSegments={breadcrumbExcludeSegments} />
          </div>
        </header>
        <div className="@container relative flex flex-1 flex-col overflow-y-auto has-[.isolate-scroll]:overflow-hidden">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
