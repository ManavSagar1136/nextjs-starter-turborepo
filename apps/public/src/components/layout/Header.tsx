"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@buildbase/ui/button";
import { ThemeToggle } from "@buildbase/ui/components/ui/theme-toggle";
import { Menu, X } from "lucide-react";
import { Routes } from "@/data/routes";
import { SiteConfig } from "@/config";

const Header = () => {
  const [isMenuOpen, setMenuOpen] = useState(false);

  const navigationItems = [
    { label: "Home", href: Routes.root },
    { label: "Contact", href: Routes.contactus },
    { label: "FAQs", href: Routes.faqs },
    { label: "Testimonials", href: Routes.testimonials },
    { label: "Affiliates", href: Routes.affiliates },
  ];

  return (
    <div
      className="header bg-background/80 sticky top-0 z-[11] mb-10 flex w-full justify-center backdrop-blur-sm"
      id="header"
    >
      <div className="bg-primary-foreground border-border flex w-full max-w-[1280px] items-center justify-between gap-3 rounded border px-6 py-4">
        {/* Logo and Brand */}
        <div className="flex min-w-[133px] shrink-0 items-center">
          <Link href={Routes.root} className="text-xl font-extrabold">
            {SiteConfig.name}
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden flex-1 items-center justify-end space-x-8 text-sm font-medium lg:flex">
          {navigationItems.map(item => (
            <Link key={item.href} href={item.href} className="hover:text-primary transition-colors">
              {item.label}
            </Link>
          ))}
          <Link href={SiteConfig.userAppUrl}>
            <Button size="sm">Get Started</Button>
          </Link>
          <ThemeToggle />
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="bg-primary-foreground border-border absolute top-full right-0 left-0 border-b shadow-lg lg:hidden">
          <nav className="flex flex-col space-y-2 p-4">
            {navigationItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:bg-accent rounded-md px-4 py-2 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="border-border flex flex-col gap-2 border-t pt-2">
              <Link href={SiteConfig.userAppUrl}>
                <Button className="w-full">Get Started</Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
};

export default Header;
