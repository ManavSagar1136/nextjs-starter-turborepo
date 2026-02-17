import Link from "next/link";
import { Routes } from "@/data/routes";
import { FaDiscord, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

import BuiltWith from "@/components/builtWith/BuiltWith";
import { Logo } from "@/components/logo/Logo";
import { SparklesSiteNameText } from "@buildbase/components/common/SparklesSiteNameText";

import { SiteConfig } from "@/config";
import { isProductLaunched } from "@/lib/utils/launch-status";

const FOOTER_CONFIG = {
  navItems: [
    {
      label: "Links",
      links: [
        { label: "Blog", href: Routes.blogs },
        { label: "Documentation", href: Routes.docs },
        {
          label: "Changelog",
          href: Routes.changelogs,
          requiresProductLive: true,
        },
        // {
        //   label: "Affiliate — Earn 30%",
        //   href: Routes.affiliates,
        //   external: true,
        //   requiresProductLive: true,
        // },
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
        { label: "Privacy Policy", href: Routes.privacy },
        { label: "Terms and Conditions", href: Routes.terms },
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
    <div className="mt-10 w-full space-y-10 px-6 md:space-y-16 lg:mt-16 lg:space-y-20">
      <footer className="mb-10 flex w-full flex-col items-center *:justify-center">
        <div className="border-border mb-20 flex w-full max-w-[1280px] items-center justify-center border-t pt-8">
          <div className="flex w-full flex-col justify-between gap-6 md:flex-row">
            {/* Left Section */}
            <div className="flex flex-col items-start">
              <div className="mb-2 flex items-center">
                <Logo />
                <span className="ml-2 text-base font-bold">
                  <SparklesSiteNameText className="dark:text-brand-100" />
                </span>
              </div>
              <p className="text-sm font-medium">Start making money today.</p>
              <BuiltWith />

              {/* Copyright */}
              <p className="text-muted-foreground mb-10 text-xs">
                <br />
                {FOOTER_CONFIG.copyright}
              </p>
            </div>

            {/* Links Section */}
            <div className="flex max-w-3xl flex-1 flex-wrap gap-6">
              {FOOTER_CONFIG.navItems.map(section =>
                section.links.length === 0 ? null : (
                  <div key={section.label} className="flex w-full min-w-52 flex-1 flex-col space-y-3">
                    <p className="text-sm font-bold uppercase">{section.label}</p>
                    <div className="flex flex-col gap-1">
                      {section.links.map(({ label, href, external, requiresProductLive }) =>
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
                        )
                      )}
                    </div>
                  </div>
                )
              )}
              <div className="flex w-full min-w-52 flex-1 flex-col space-y-3">
                <p className="text-sm font-bold uppercase">Social</p>
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  {FOOTER_CONFIG.socialLinks.map(({ name, url, icon: Icon }) => (
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
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
