"use client";

import { WorkspaceSwitcher as SDKWorkspaceSwitcher, useSaaSAuth } from "@buildbase/saas-sdk";
import { memo } from "react";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@buildbase/ui/components/ui/sidebar";
import { Building2, ChevronDown } from "lucide-react";
import { cn } from "@buildbase/ui/lib/utils";

/**
 * Stable trigger function defined outside component to prevent re-creation
 * This ensures the function reference never changes, preventing infinite re-renders
 *
 * Note: We use asChild on SidebarMenuButton to avoid nested <button> elements.
 * The SDK's WorkspaceSwitcher wraps this with a DialogTrigger which renders a button,
 * so we need our component to NOT render a button itself.
 */
const createTriggerComponent = (isLoading: boolean, currentWorkspace: any) => {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className={cn("w-full justify-between", isLoading && "cursor-not-allowed opacity-50")}
        >
          <div className={cn(isLoading && "pointer-events-none")}>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Building2 className="size-4 shrink-0" />
              <span className="truncate text-sm font-medium">
                {isLoading ? "Switching..." : currentWorkspace?.name || "Select workspace"}
              </span>
            </div>
            <ChevronDown className="ml-auto size-4 shrink-0" />
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

/**
 * Workspace switcher component for dashboard sidebar
 * Uses the Buildbase SDK's WorkspaceSwitcher component
 *
 * Note: onWorkspaceChange prop is available but the SDK handles workspace switching
 * through its event system. The callback can be used for additional custom logic.
 */
const WorkspaceSwitcherComponent = () => {
  const { isLoading, isAuthenticated, isRedirecting } = useSaaSAuth();

  if (isLoading || !isAuthenticated || isRedirecting) {
    return null;
  }
  // Use the stable function defined outside - this reference never changes
  // This prevents the SDK from re-rendering due to function reference changes
  return <SDKWorkspaceSwitcher trigger={createTriggerComponent} />;
};

// Memoize with a custom comparison function to prevent re-renders
// Only re-render if props actually change
export const WorkspaceSwitcher = memo(WorkspaceSwitcherComponent, () => true);
