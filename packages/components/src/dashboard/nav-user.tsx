"use client";

import { useCallback } from "react";
import { ChevronsUpDown, LogOut, User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@buildbase/ui/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@buildbase/ui/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@buildbase/ui/components/ui/sidebar";
import { Skeleton } from "@buildbase/ui/components/ui/skeleton";

import { useAuth } from "@buildbase/helpers/hooks/use-auth";
import { useSDKAuth } from "@buildbase/saas-sdk";

export interface NavUserProps {
  /**
   * Optional custom logout handler
   * If provided, this will be used instead of the SDK's signOut
   * Otherwise, the SDK's signOut will be used (which triggers onSignOut callback in SaaSProvider)
   */
  onLogout?: () => Promise<void>;
}

/**
 * User profile dropdown component for dashboard sidebar
 *
 * Uses the SDK's signOut method by default, which triggers the onSignOut callback
 * in SaaSProvider (handles Redux cleanup, API logout, and page reload).
 *
 * @example
 * ```tsx
 * <NavUser />
 *
 * // Or with custom logout handler
 * <NavUser
 *   onLogout={async () => {
 *     await customLogout();
 *   }}
 * />
 * ```
 */
export function NavUser({ onLogout }: NavUserProps) {
  const { isMobile } = useSidebar();
  const { isLoading, isAuthenticated, user } = useAuth();
  const { signOut, openWorkspaceSettings } = useSDKAuth();

  const handleSignOut = useCallback(async () => {
    if (onLogout) {
      await onLogout();
    } else {
      await signOut();
    }
  }, [onLogout, signOut]);

  const handleOpenProfile = useCallback(() => {
    openWorkspaceSettings("profile");
  }, [openWorkspaceSettings]);

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="pointer-events-none [&_.animate-pulse]:!bg-gray-300/50">
            <Skeleton className="h-8 w-8 animate-pulse rounded-lg" />
            <div className="grid flex-1 gap-1 text-left text-sm leading-tight">
              <Skeleton className="h-4 w-24 animate-pulse" />
              <Skeleton className="h-3 w-32 animate-pulse" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <CustomAvatar user={user} />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user?.name || "User"}</span>
                <span className="truncate text-xs">{user?.email || ""}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <CustomAvatar user={user} />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.name || "User"}</span>
                    <span className="truncate text-xs">{user?.email || ""}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuItem className="gap-2 p-2" onClick={handleOpenProfile}>
                <User className="size-4" />
                Profile
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuItem className="gap-2" onClick={handleSignOut}>
              <LogOut className="size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

/**
 * Avatar component for user display
 */
const CustomAvatar = ({ user }: { user: { name?: string; email?: string; image?: string } | null | undefined }) => {
  const getInitials = () => {
    if (!user) return "U";

    if (user.name && user.name.length > 0) {
      return user.name
        .split(" ")
        .map(name => name?.[0] || "")
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user.email && user.email.length > 0) {
      return user.email[0]?.toUpperCase() || "U";
    }
    return "U";
  };

  if (!user) {
    return (
      <Avatar className="h-8 w-8 rounded-lg">
        <AvatarFallback className="rounded-lg uppercase">U</AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar className="h-8 w-8 rounded-lg">
      <AvatarImage src={user.image} alt={user.name || "User"} />
      <AvatarFallback className="rounded-lg uppercase">{getInitials()}</AvatarFallback>
    </Avatar>
  );
};
