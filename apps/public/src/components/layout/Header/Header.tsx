"use client";

import { useState } from "react";
import Link from "next/link";
import { Routes } from "@/data/routes";

import { Logo } from "@/components/logo/Logo";

import { SiteConfig } from "@/config";
import { isProductLaunched } from "@/lib/utils/launch-status";
import { useGetStarted } from "@/hooks/use-get-started";

import { RainbowButton } from "@buildbase/magicui/components/rainbow-button";
import HeaderNavigationMenu from "./HeaderNavigationMenu";
import HeaderSideMenubar from "./HeaderSideMenubar";
import { ThemeToggle } from "@buildbase/ui/components/ui/theme-toggle";

const Header = () => {
  const { isLogged, isLoginLoading, isLoadingCta, onGetStartedClick } = useGetStarted();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const isProductLive = isProductLaunched();

  return (
    <div
      className="header w-full flex justify-center mb-10 sticky top-0 z-[11]"
      id="header"
      key="header"
    >
      <div className="max-w-[1280px] w-full flex items-center justify-between bg-white px-6 py-4 rounded gap-3">
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
          <RainbowButton
            size="sm"
            onClick={onGetStartedClick}
            disabled={isLoadingCta || isLoginLoading}
            progress={isLoginLoading}
          >
            {isLogged ? "Go to app" : "Get started"}
          </RainbowButton>
          <ThemeToggle />
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
