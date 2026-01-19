"use client";

import { Building2, LayoutDashboard, Users, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ConditionalDashboardLayout } from "./conditional-dashboard-layout";
import type { DashboardLayoutProps } from "./types";

// Icon mapping - maps icon names to actual icon components
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  Building2,
  User,
};

interface MenuItemConfig {
  title: string;
  url: string;
  items?: Array<{
    title: string;
    url: string;
    iconName?: string;
  }>;
}

interface DashboardConfigProviderProps extends Omit<DashboardLayoutProps, "menuItems"> {
  /**
   * Menu items configuration with icon names as strings
   * Icons will be resolved client-side from the iconMap
   */
  menuItemsConfig: MenuItemConfig[];
  /**
   * Profile route path (required)
   */
  profileRoute: string;
  /**
   * Optional custom logout handler
   * If not provided, SDK's signOut will be used (triggers onSignOut callback in SaaSProvider)
   */
  onLogout?: () => Promise<void>;
  /**
   * Routes that should NOT have the dashboard layout
   */
  excludeRoutes?: string[];
}

/**
 * Client component that resolves icon names to icon components
 * This allows passing icon names from server components
 */
export function DashboardConfigProvider({ menuItemsConfig, ...props }: DashboardConfigProviderProps) {
  // Resolve icons client-side
  const menuItems = menuItemsConfig.map(group => ({
    ...group,
    items: group.items?.map(item => ({
      ...item,
      icon: item.iconName ? iconMap[item.iconName] : undefined,
    })),
  }));

  return <ConditionalDashboardLayout menuItems={menuItems as any} {...props} />;
}
