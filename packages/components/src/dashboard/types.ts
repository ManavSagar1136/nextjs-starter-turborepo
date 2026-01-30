import type { LucideIcon } from "lucide-react";

/**
 * Menu item configuration for dashboard navigation
 */
export interface MenuItem {
  /**
   * Display title of the menu item
   */
  title: string;
  /**
   * URL path for the menu item
   */
  url: string;
  /**
   * Optional icon component (Lucide icon)
   */
  icon?: LucideIcon;
  /**
   * Whether this item is currently active (auto-detected if not provided)
   */
  isActive?: boolean;
  /**
   * Nested menu items (supports unlimited depth)
   */
  items?: MenuItem[];
}

/**
 * Props for the DashboardLayout component
 */
export interface DashboardLayoutProps {
  /**
   * Array of menu items to display in the sidebar
   */
  menuItems: MenuItem[];
  /**
   * Path segments to exclude from breadcrumb generation
   * @example ['/user', '/admin'] - hides 'user' and 'admin' from breadcrumbs
   */
  breadcrumbExcludeSegments?: string[];
  /**
   * Whether to show the team/workspace switcher component
   * @default false
   */
  showTeamSwitcher?: boolean;
  /**
   * Optional callback when workspace is changed
   * If not provided, the component will handle workspace switching with default behavior
   */
  onWorkspaceChange?: (workspace: any) => Promise<void> | void;
  /**
   * Brand configuration for sidebar header
   * If not provided, no brand will be shown
   */
  brand?: {
    /**
     * Brand text/name to display
     */
    text: string;
    /**
     * URL to navigate to when brand is clicked
     */
    href: string;
  };
  /**
   * Page content to render in the main area
   */
  children: React.ReactNode;
  /**
   * Optional className for the layout container
   */
  className?: string;
}
