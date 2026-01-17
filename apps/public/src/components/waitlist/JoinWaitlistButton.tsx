"use client";

import Link from "next/link";

import { withPreLaunchOnly } from "@/components/hoc/launch/withLaunchStatus";
import { RainbowButton } from "@buildbase/magicui/components/rainbow-button";
import { ButtonProps } from "@buildbase/ui/button";

interface JoinWaitlistButtonProps {
  /**
   * Whether to close the mobile menu before scrolling (for mobile navigation)
   * @default false
   */
  closeMenu?: boolean;
  /**
   * Callback function to close the menu (if provided)
   */
  onMenuClose?: () => void;
  /**
   * Additional CSS classes for the button
   */
  className?: string;
  /**
   * Size of the button
   * @default "sm"
   */
  size?: "sm" | "md" | "lg";
}

/**
 * JoinWaitlistButton component
 * A reusable button that scrolls to the waitlist section on the page
 */
const JoinWaitlistButtonComponent = ({
  closeMenu = false,
  onMenuClose,
  className,
  size = "sm",
}: JoinWaitlistButtonProps) => {
  /**
   * Handles scrolling to the waitlist section
   */
  const handleScrollToWaitlist = () => {
    if (closeMenu && onMenuClose) {
      onMenuClose();
      setTimeout(() => {
        scrollToWaitlist();
      }, 300);
    } else {
      scrollToWaitlist();
    }
  };

  /**
   * Scrolls to the waitlist section on the page
   */
  const scrollToWaitlist = () => {
    const element = document.getElementById("waitlist");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <Link
      href="/#waitlist"
      onClick={(e) => {
        e.preventDefault();
        handleScrollToWaitlist();
      }}
    >
      <RainbowButton size={size as ButtonProps["size"]} className={className}>
        Join Waitlist
      </RainbowButton>
    </Link>
  );
};

export const JoinWaitlistButton = withPreLaunchOnly(
  JoinWaitlistButtonComponent,
);
