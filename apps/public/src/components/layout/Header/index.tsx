import Link from "next/link";
import { Routes } from "@/data/routes";
import { AlertCircle, Inbox } from "lucide-react";

import { cn } from "@buildbase/ui/lib/utils";

import { NavigationMenuLink } from "@buildbase/ui/components/ui/navigation-menu";

interface INavigationItem {
  href?: string;
  requiresProductLive?: boolean;
  label: string;
  hasDropdown?: boolean;
  key?: string;
  className?: string;
  isSparkles?: boolean;
}

/**
 * Object that holds header navigation keys for easily
 * matching against items that have dropdown logic, e.g., Blogs.
 */
export const HEADER_KEYS = {
  BLOGS: "blogs",
  DOCS: "docs",
};

/**
 * Navigation items used in the header navigation bar.
 * Each item can be a simple link or a dropdown trigger.
 * For public app, we only include items that don't require blogs/docs
 */
export const NAVIGATION_ITEMS: INavigationItem[] = [
  { href: Routes.root, label: "Home" },
  {
    href: Routes.contactus,
    label: "Contact Us",
  },
  {
    href: Routes.faqs,
    label: "FAQs",
  },
  {
    href: Routes.testimonials,
    label: "Testimonials",
  },
  {
    href: Routes.affiliates,
    label: "Affiliates",
  },
];

/**
 * Renders a view for generic error states in the dropdown.
 *
 * @param message   Error message to display
 * @returns         JSX for the error block
 */
export const HeaderDropDownErrorView = ({ message }: { message: string }) => {
  return (
    <div className="flex-center flex-col gap-2 px-4 py-4 text-sm text-muted-foreground bg-destructive/10 border border-destructive/50 rounded-lg">
      <AlertCircle className="size-6 text-destructive flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
};

/**
 * Renders a UI block for empty data scenarios within dropdown sections.
 *
 * @param message   Message to display when the section is empty
 * @returns         JSX for the empty block
 */
export const HeaderDropDownEmptyView = ({ message }: { message: string }) => {
  return (
    <div className="flex-center flex-col gap-2 px-4 py-4 text-sm text-muted-foreground bg-muted/50 border border-muted/50 rounded-lg">
      <Inbox className="size-6 text-muted-foreground flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
};

/**
 * Renders an individual navigation link styled appropriately for dropdown sections.
 * Highlights the link if it matches the current active URL.
 *
 * @param href       The destination URL of the link
 * @param children   Inner React nodes/text
 * @param activeUrl  Current active URL (for active highlighting)
 * @param onLinkClick Optional callback to execute when link is clicked (e.g., close sheet)
 * @param props      Additional props passed to the Link element
 * @returns          JSX element for the navigation menu link
 */
export const HeaderDropDownLinkItem = ({
  href,
  children,
  activeUrl = "",
  onLinkClick,
  withNavigationMenuLink = false,
  ...props
}: React.ComponentProps<typeof Link> & {
  activeUrl?: string;
  onLinkClick?: () => void;
  withNavigationMenuLink?: boolean;
}) => {
  const handleClick = () => {
    onLinkClick?.();
  };

  return withNavigationMenuLink ? (
    <NavigationMenuLink asChild>
      <Link
        {...props}
        href={href}
        onClick={handleClick}
        className={cn(
          "block text-sm px-2 py-1.5 rounded-lg",
          "bg-background hover:bg-accent hover:text-accent-foreground",
          "border border-transparent hover:border-border",
          "transition-all duration-200 ease-in-out",
          "truncate",
          "font-medium",
          "active:scale-[0.98]",
          activeUrl === href &&
            "border-brand-600 bg-brand-50 text-brand-950 hover:bg-brand-100 hover:text-brand-950 hover:border-brand-600",
        )}
        tabIndex={0}
      >
        {children}
      </Link>
    </NavigationMenuLink>
  ) : (
    <Link
      {...props}
      href={href}
      onClick={handleClick}
      className={cn(
        "block text-sm px-2 py-1.5 rounded-lg",
        "bg-background hover:bg-accent hover:text-accent-foreground",
        "border border-transparent hover:border-border",
        "transition-all duration-200 ease-in-out",
        "truncate",
        "font-medium",
        "active:scale-[0.98]",
        activeUrl === href &&
          "border-brand-600 bg-brand-50 text-brand-950 hover:bg-brand-100 hover:text-brand-950 hover:border-brand-600",
      )}
      tabIndex={0}
    >
      {children}
    </Link>
  );
};
