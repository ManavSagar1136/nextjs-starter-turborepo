"use client";

import { useState } from "react";
import Link from "next/link";
import { Routes } from "@/data/routes";

import { Logo } from "@/components/logo/Logo";

import { SiteConfig } from "@/config";
import { isProductLaunched } from "@/lib/utils/launch-status";

import { RainbowButton } from "@buildbase/magicui/components/rainbow-button";
import { ThemeToggler } from "@/components/ui/ThemeToggler";
import { JoinWaitlistButton } from "@/components/marketing/JoinWaitlistButton";
import HeaderNavigationMenu from "./HeaderNavigationMenu";
import HeaderSideMenubar from "./HeaderSideMenubar";

const Header = () => {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const isProductLive = isProductLaunched();

  const handleGetStartedClick = () => {
    window.location.href = SiteConfig.userAppUrl;
  };

  return (
    <div
      className="header w-full flex justify-center mb-10 sticky top-0 z-[11]"
      id="header"
      key="header"
    >
      <div className="max-w-[1280px] w-full flex items-center justify-between bg-primary-foreground px-6 py-4 rounded gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center min-w-[133px] shrink-0">
          <div className="w-8 h-8 mr-2 overflow-hidden">
            <Logo />
          </div>
          <Link href={Routes.root} className="font-extrabold">
            {SiteConfig.name}
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center justify-end flex-1 space-x-8 text-sm font-medium">
          <HeaderNavigationMenu isProductLive={isProductLive} />
          {isProductLive ? (
            <>
              <Link href={`${SiteConfig.userAppUrl}/login`} className="hidden sm:block">
                Login
              </Link>
              <Link href={SiteConfig.userAppUrl}>
                <RainbowButton size="sm">
                  Get started
                </RainbowButton>
              </Link>
              <ThemeToggler />
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
          onGetStartedClick={handleGetStartedClick}
          isLoadingCta={false}
          isLoginLoading={false}
          isLogged={false}
          isProductLive={isProductLive}
        />
      </div>
    </div>
  );
};

export default Header;
