import React from "react";
import Link from "next/link";
import { THEME_COLOR } from "@/utils/colors";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@buildbase/ui/components/ui/navigation-menu";

import { cn } from "@buildbase/ui/lib/utils";

import { HEADER_KEYS, NAVIGATION_ITEMS } from ".";
import { SparklesText } from "@/components/SparklesSiteNameText";

/**
 * Constant storing tailwind styles for navigation menu triggers,
 * reused for consistency and easy overrides.
 */
const navigationMenuTriggerStyle = "!bg-transparent px-0 text-sm";

/**
 * HeaderNavigationMenu
 *
 * Renders the top-level navigation menu for the site header, including
 * support for normal navigation links and dropdown menus.
 *
 * - Each navigation item can be a simple link or a dropdown.
 * - Sparkling animated text is optionally shown for items marked with isSparkles.
 *
 * @component
 * @returns {JSX.Element}
 */
const HeaderNavigationMenu: React.FC<{ isProductLive: boolean }> = ({
  isProductLive,
}) => {
  return (
    <NavigationMenu className="ml-auto">
      <NavigationMenuList className="gap-4">
        {NAVIGATION_ITEMS.filter((item) =>
          item.requiresProductLive ? isProductLive : true,
        ).map((item, index) => {
          // Extract repeated label rendering logic for sparkles animation
          const labelContent = item.isSparkles ? (
            <SparklesText
              text={item.label}
              sparklesCount={3}
              colors={{
                first: THEME_COLOR[200],
                second: THEME_COLOR[900],
              }}
            />
          ) : (
            item.label
          );

          return (
            <NavigationMenuItem key={index}>
              {/* Render dropdown-enabled items if hasDropdown is true */}
              {item.hasDropdown ? (
                <>
                  {/* The trigger renders as a button with correct classes, but inside it is a Link for semantic/SEO/keyboard reasons.
                      We stop event propagation to ensure the trigger logic isn't interfered with by nested Link clicks. */}
                  <NavigationMenuTrigger
                    className={cn(navigationMenuTriggerStyle, item?.className)}
                  >
                    {item.href ? (
                      <Link
                        href={item.href}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span>{item.label}</span>
                    )}
                  </NavigationMenuTrigger>

                  {/* Dropdown content - currently no dropdowns in public app */}
                  <NavigationMenuContent className="rounded-20">
                    {/* No dropdowns for public app */}
                  </NavigationMenuContent>
                </>
              ) : // Render a normal navigation link item
              item.href ? (
                <NavigationMenuLink
                  asChild
                  className={cn(navigationMenuTriggerStyle, item?.className)}
                >
                  <Link href={item.href} className={item?.className}>
                    {labelContent}
                  </Link>
                </NavigationMenuLink>
              ) : (
                <NavigationMenuLink
                  className={cn(navigationMenuTriggerStyle, item?.className)}
                >
                  {labelContent}
                </NavigationMenuLink>
              )}
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default HeaderNavigationMenu;
