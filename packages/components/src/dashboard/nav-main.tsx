"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@buildbase/ui/components/ui/sidebar";

import { cn } from "@buildbase/ui/lib/utils";
import type { MenuItem } from "./types";

/**
 * Recursively checks if any nested item is active
 */
function isItemActive(item: MenuItem, pathname: string): boolean {
  if (item.url === pathname) {
    return true;
  }
  if (item.items) {
    return item.items.some(subItem => isItemActive(subItem, pathname));
  }
  return false;
}

/**
 * Renders a single menu item with support for nested items
 */
function MenuItemComponent({ item, pathname }: { item: MenuItem; pathname: string }) {
  const isActive = item.isActive ?? isItemActive(item, pathname);
  const hasNestedItems = item.items && item.items.length > 0;

  if (hasNestedItems) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          className={cn(
            isActive ? "border-sidebar-accent text-sidebar-accent-foreground border" : "text-sidebar-foreground"
          )}
        >
          <Link href={item.url}>
            {item.icon && <item.icon className="size-4" />}
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
        <SidebarMenuSub>
          {item.items?.map(subItem => {
            const isSubActive = subItem.isActive ?? subItem.url === pathname;
            return (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton asChild isActive={isSubActive}>
                  <Link href={subItem.url}>
                    {subItem.icon && <subItem.icon className="size-4" />}
                    <span>{subItem.title}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className={cn(
          isActive ? "border-sidebar-accent text-sidebar-accent-foreground border" : "text-sidebar-foreground"
        )}
      >
        <Link href={item.url}>
          {item.icon && <item.icon className="size-4" />}
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/**
 * Navigation menu component with support for nested menu items
 *
 * Each menu item can have nested items. Items with nested items are displayed as groups.
 *
 * @example
 * ```tsx
 * <NavMain items={[
 *   {
 *     title: "Overview",
 *     url: "#",
 *     items: [
 *       { title: "Dashboard", url: "/dashboard", icon: LayoutIcon },
 *     ],
 *   },
 * ]} />
 * ```
 */
export function NavMain({ items }: { items: MenuItem[] }) {
  const pathname = usePathname();

  return (
    <>
      {items.map(groupItem => {
        // If item has nested items, render as a group
        if (groupItem.items && groupItem.items.length > 0) {
          return (
            <SidebarGroup key={groupItem.title}>
              <SidebarGroupLabel>{groupItem.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {groupItem.items.map(item => (
                    <MenuItemComponent key={item.title} item={item} pathname={pathname} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        }

        // Single items without nested items - render as a standalone group
        return (
          <SidebarGroup key={groupItem.title}>
            <SidebarGroupLabel>{groupItem.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <MenuItemComponent item={groupItem} pathname={pathname} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        );
      })}
    </>
  );
}
