"use client";

import { useState } from "react";
import Link from "next/link";
import { Routes } from "@/data/routes";

import { Logo } from "@/components/logo/Logo";

import { SiteConfig } from "@/config";
import { isProductLaunched } from "@/lib/utils/launch-status";
import { useGetStarted } from "@/hooks/use-get-started";

import { RainbowButton } from "@buildbase/magicui/components/rainbow-button";
import { JoinWaitlistButton } from "@/components/waitlist/JoinWaitlistButton";
import HeaderNavigationMenu from "./HeaderNavigationMenu";
import HeaderSideMenubar from "./HeaderSideMenubar";
import { ThemeToggle } from "@buildbase/ui/components/ui/theme-toggle";

const Header = () => {
  const { isLogged, isLoginLoading, isLoadingCta, onGetStartedClick } = useGetStarted();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const isProductLive = isProductLaunched();

  return (
    <div className="header sticky top-0 z-[11] mb-10 flex w-full justify-center" id="header" key="header">
      <div className="bg-primary-foreground flex w-full max-w-[1280px] items-center justify-between gap-3 rounded px-6 py-4">
        {/* Logo and Brand */}
        <div className="flex min-w-[133px] shrink-0 items-center">
          <div className="mr-2 h-8 w-8 overflow-hidden">
            <Logo />
          </div>
          <Link href={Routes.root} className="font-extrabold">
            {SiteConfig.name}
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden flex-1 items-center justify-end space-x-8 text-sm font-medium lg:flex">
          <HeaderNavigationMenu isProductLive={isProductLive} />
          {isProductLive ? (
            <>
              <RainbowButton
                size="sm"
                onClick={onGetStartedClick}
                disabled={isLoadingCta || isLoginLoading}
                progress={isLoginLoading}
              >
                {isLogged ? "Go to app" : "Get started"}
              </RainbowButton>
              <ThemeToggle />
            </>
          ) : (
            <div className="hidden sm:block">
              <JoinWaitlistButton />
            </div>
          )}
        </div>

        <HeaderSideMenubar
          open={isMenuOpen}
          onOpenChange={setMenuOpen}
          onGetStartedClick={onGetStartedClick}
          isLoadingCta={isLoadingCta}
          isLoginLoading={isLoginLoading}
          isLogged={isLogged}
          isProductLive={isProductLive}
        />
      </div>
    </div>
  );
};

export default Header;
