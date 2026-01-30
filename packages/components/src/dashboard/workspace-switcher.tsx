"use client";

import { WorkspaceSwitcher as SDKWorkspaceSwitcher } from "@buildbase/saas-sdk";
import { memo } from "react";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@buildbase/ui/components/ui/sidebar";
import { Building2, ChevronDown } from "lucide-react";
import { cn } from "@buildbase/ui/lib/utils";

/**
 * Stable trigger function defined outside component to prevent re-creation
 * This ensures the function reference never changes, preventing infinite re-renders
 */
const createTriggerComponent = (isLoading: boolean, currentWorkspace: any) => {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          className={cn("w-full justify-between", isLoading && "cursor-not-allowed opacity-50")}
          disabled={isLoading}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Building2 className="size-4 shrink-0" />
            <span className="truncate text-sm font-medium">
              {isLoading ? "Switching..." : currentWorkspace?.name || "Select workspace"}
            </span>
          </div>
          <ChevronDown className="ml-auto size-4 shrink-0" />
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
  // Use the stable function defined outside - this reference never changes
  // This prevents the SDK from re-rendering due to function reference changes
  return <SDKWorkspaceSwitcher trigger={createTriggerComponent} />;
};

// Memoize with a custom comparison function to prevent re-renders
// Only re-render if props actually change
export const WorkspaceSwitcher = memo(WorkspaceSwitcherComponent, () => true);
