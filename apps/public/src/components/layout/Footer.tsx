import Link from "next/link";
import { Routes } from "@/data/routes";
import { FaDiscord, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

import BuiltWith from "@/components/ui/BuiltWith";
import { Logo } from "@/components/logo/Logo";
import { SparklesSiteNameText } from "@/components/SparklesSiteNameText";

import { SiteConfig } from "@/config";
import { isProductLaunched } from "@/lib/utils/launch-status";

import { Waitlist } from "@/components/marketing/Waitlist";

const FOOTER_CONFIG = {
  navItems: [
    {
      label: "Links",
      links: [
        { label: "Contact Us", href: Routes.contactus },
        {
          label: "FAQs",
          href: Routes.faqs,
          requiresProductLive: true,
        },
        {
          label: "Affiliate — Earn 30%",
          href: Routes.affiliates,
          external: true,
          requiresProductLive: true,
        },
        {
          label: "Testimonials",
          href: Routes.testimonials,
          requiresProductLive: true,
        },
      ],
    },
    {
      label: "Legal",
      links: [
        { label: "Contact Us", href: Routes.contactus },
        { label: "FAQs", href: Routes.faqs, requiresProductLive: true },
      ],
    },
  ],
  socialLinks: [
    { name: "Discord", url: SiteConfig.socials.discordLink, icon: FaDiscord },
    { name: "YouTube", url: SiteConfig.socials.youTubeLink, icon: FaYoutube },
    { name: "Twitter", url: SiteConfig.socials.twitterLink, icon: FaXTwitter },
  ],
  copyright: `© Copyright ${new Date().getFullYear()} ${SiteConfig.name}. All rights reserved.`,
};

export const Footer = () => {
  const isProductLive = isProductLaunched();

  return (
    <div className="space-y-10 md:space-y-16 lg:space-y-20 px-6 w-full mt-10 lg:mt-16">
      <Waitlist />
      <footer className="w-full flex flex-col *:justify-center mb-10 items-center">
        <div className="max-w-[1280px] border-t border-border flex w-full items-center justify-center pt-8 mb-20">
          <div className="flex flex-col justify-between md:flex-row w-full gap-6">
            {/* Left Section */}
            <div className="flex flex-col items-start">
              <div className="flex items-center mb-2">
                <Logo />
                <span className="font-bold text-base ml-2">
                  <SparklesSiteNameText className="dark:text-brand-100" />
                </span>
              </div>
              <p className="font-medium text-sm">Start making money today.</p>
              <BuiltWith />

              {/* Copyright */}
              <p className="text-xs text-muted-foreground mb-10">
                <br />
                {FOOTER_CONFIG.copyright}
              </p>
            </div>

            {/* Links Section */}
            <div className="flex flex-wrap gap-6 flex-1 max-w-3xl">
              {FOOTER_CONFIG.navItems.map((section) =>
                section.links.length === 0 ? null : (
                  <div
                    key={section.label}
                    className="flex flex-col flex-1 w-full space-y-3 min-w-52"
                  >
                    <p className="font-bold uppercase text-sm">
                      {section.label}
                    </p>
                    <div className="flex flex-col gap-1">
                      {section.links.map(
                        ({ label, href, external, requiresProductLive }) =>
                          requiresProductLive && !isProductLive ? null : (
                            <Link
                              key={label}
                              href={href}
                              className="hover:underline"
                              {...(external && {
                                target: "_blank",
                                rel: "noopener noreferrer",
                              })}
                            >
                              {label}
                            </Link>
                          ),
                      )}
                    </div>
                  </div>
                ),
              )}
              <div className="flex flex-col w-full space-y-3 flex-1 min-w-52">
                <p className="font-bold uppercase text-sm">Social</p>
                <div className="flex items-center gap-4 flex-wrap mt-2">
                  {FOOTER_CONFIG.socialLinks.map(
                    ({ name, url, icon: Icon }) => (
                      <Link
                        key={name}
                        href={url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-foreground"
                        title={`Visit our ${name} page`}
                      >
                        <Icon className="h-5 w-5" />
                      </Link>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
