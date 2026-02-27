import Link from "next/link";
import { Routes } from "@/data/routes";
import { FaDiscord, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

import BuiltWith from "@/components/builtWith/BuiltWith";
import { Logo } from "@/components/logo/Logo";

import { SiteConfig } from "@/config";
import { isProductLaunched } from "@/lib/utils/launch-status";

type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
  requiresProductLive?: boolean;
};

const FOOTER_CONFIG: {
  navItems: Array<{
    label: string;
    links: FooterLink[];
  }>;
  socialLinks: Array<{
    name: string;
    url: string | null;
    icon: React.ComponentType<{ className?: string }>;
  }>;
  copyright: string;
} = {
  navItems: [
    {
      label: "Product",
      links: [
        { label: "Features", href: "/#features" },
        { label: "Pricing", href: Routes.pricing },
        { label: "Documentation", href: Routes.docs },
        { label: "Blog", href: Routes.blogs },
        {
          label: "Changelog",
          href: Routes.changelogs,
          requiresProductLive: true,
        },
      ],
    },
    {
      label: "Company",
      links: [
        { label: "Contact Us", href: Routes.contactus },
        { label: "FAQs", href: Routes.faqs, requiresProductLive: true },
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
  copyright: `\u00A9 ${new Date().getFullYear()} ${SiteConfig.name}. All rights reserved.`,
};

export const Footer = () => {
  const isProductLive = isProductLaunched();

  return (
    <footer
      className="w-full bg-white dark:bg-dark-surface"
      role="contentinfo"
    >
      <div
        className="mx-auto max-w-[1280px] border-t border-slate-200 dark:border-slate-800 px-6 pt-12 pb-8"
      >
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          {/* Left Section — Logo + tagline */}
          <div className="flex max-w-xs flex-col items-start">
            <div className="mb-3 flex items-center gap-2">
              <Logo />
              <span className="text-base font-bold text-slate-900 dark:text-slate-50">
                {SiteConfig.name}
              </span>
            </div>
            <p
              className="mb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400"
            >
              The open-source CMS monorepo template for modern teams.
            </p>

            {/* Social icons */}
            <div className="mb-6 flex items-center gap-4">
              {FOOTER_CONFIG.socialLinks.map(({ name, url, icon: Icon }) =>
                url ? (
                  <Link
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 dark:text-slate-600 hover:text-slate-900 dark:hover:text-slate-50 transition-colors duration-200"
                    title={`Visit our ${name} page`}
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                ) : null,
              )}
            </div>

            <BuiltWith />
          </div>

          {/* Right Section — Link columns */}
          <div className="flex flex-1 flex-wrap gap-8 md:justify-end">
            {FOOTER_CONFIG.navItems.map((section) =>
              section.links.length === 0 ? null : (
                <div key={section.label} className="flex min-w-[140px] flex-col gap-3">
                  <p
                    className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600"
                  >
                    {section.label}
                  </p>
                  {section.links.map((link: FooterLink) => {
                    const { label, href, external, requiresProductLive } = link;
                    return requiresProductLive && !isProductLive ? null : (
                      <Link
                        key={label}
                        href={href}
                        className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 transition-colors duration-200"
                        {...(external && {
                          target: "_blank",
                          rel: "noopener noreferrer",
                        })}
                      >
                        {label}
                      </Link>
                    );
                  })}
                </div>
              ),
            )}
          </div>
        </div>

        {/* Copyright */}
        <div
          className="mt-10 border-t border-slate-200 dark:border-slate-800 pt-6 text-center"
        >
          <p
            className="text-xs text-slate-400 dark:text-slate-600"
          >
            {FOOTER_CONFIG.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
};
