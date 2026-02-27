"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useTheme } from "next-themes";

import { Logo } from "@/components/logo/Logo";
import { SiteConfig } from "@/config";
import { useGetStarted } from "@/hooks/use-get-started";
import { navEntrance, getMotionVariant } from "@/lib/animation-variants";

// ─── Nav links ───────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Features",    href: "/#features" },
  { label: "Architecture", href: "/#architecture" },
  { label: "Pricing",     href: "/#pricing" },
  { label: "Docs",        href: "/docs" },
] as const;

// ─── Framer variants ──────────────────────────────────────────────────────────

const mobileMenuVariants = {
  hidden:  { opacity: 0, y: -16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

const mobileLinkVariants = {
  hidden:  { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, delay: i * 0.07, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const mobileMenuReducedVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.15 } },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const shouldReduce = useReducedMotion();

  const { isLogged, isLoadingCta, isLoginLoading, onGetStartedClick } = useGetStarted();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Show border-bottom once page scrolls past 20px
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const entranceVariant = getMotionVariant(shouldReduce, navEntrance);

  return (
    <>
      {/* ── Main Nav Bar ─────────────────────────────────────────────────── */}
      <motion.header
        variants={entranceVariant}
        initial="hidden"
        animate="visible"
        className={[
          // Layout
          "fixed top-0 left-0 right-0 z-50 w-full",
          // Glass morphism bg (always on — scroll only adds border)
          "mk-nav-blur",
          // Scroll-dependent border-bottom
          scrolled ? "border-b border-[var(--mk-border)]" : "border-b border-transparent",
          "transition-[border-color] duration-300",
        ].join(" ")}
        role="banner"
      >
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6">

          {/* Left: Logo + Wordmark */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0 group"
            aria-label={`${SiteConfig.name} — go to homepage`}
          >
            <div className="w-7 h-7 overflow-hidden">
              <Logo />
            </div>
            <span className="font-extrabold text-[var(--mk-text-primary)] text-base tracking-tight group-hover:text-[var(--mk-brand)] transition-colors duration-200">
              {SiteConfig.name}
            </span>
          </Link>

          {/* Center: Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-8" aria-label="Primary navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={[
                  "relative text-sm font-medium text-[var(--mk-text-secondary)]",
                  "hover:text-[var(--mk-text-primary)] transition-colors duration-200",
                  // Underline slide-in on hover
                  "after:absolute after:bottom-[-2px] after:left-0 after:h-px after:w-0",
                  "after:bg-[var(--mk-brand)] after:transition-[width] after:duration-200",
                  "hover:after:w-full",
                ].join(" ")}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right: CTA Buttons + Mobile Trigger */}
          <div className="flex items-center gap-3">
            {/* Sign In — ghost, desktop only */}
            <Link
              href={SiteConfig.userAppUrl}
              className="hidden lg:inline-flex items-center text-sm font-medium text-[var(--mk-text-secondary)] hover:text-[var(--mk-text-primary)] transition-colors duration-200 px-3 py-1.5 rounded-[var(--mk-radius-sm)] hover:bg-[var(--mk-bg-elevated)]"
              aria-label="Sign in to your account"
            >
              Sign In
            </Link>

            {/* Get Started — brand filled */}
            <button
              onClick={onGetStartedClick}
              disabled={isLoadingCta || isLoginLoading}
              className={[
                "hidden lg:inline-flex items-center justify-center",
                "text-sm font-semibold text-white px-4 py-2",
                "rounded-[var(--mk-radius-sm)] bg-[var(--mk-brand)]",
                "hover:bg-[var(--mk-brand-glow)] hover:shadow-[0_0_32px_rgba(99,102,241,0.25)]",
                "transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
              ].join(" ")}
              aria-label={isLogged ? "Go to the app" : "Get started for free"}
            >
              {isLogged ? "Go to app" : "Get started"}
            </button>

            {/* Theme toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="flex items-center justify-center w-9 h-9 rounded-[var(--mk-radius-sm)] text-[var(--mk-text-secondary)] hover:bg-[var(--mk-bg-elevated)] hover:text-[var(--mk-text-primary)] transition-colors duration-200"
                aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
              >
                {resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-[var(--mk-radius-sm)] text-[var(--mk-text-secondary)] hover:bg-[var(--mk-bg-elevated)] hover:text-[var(--mk-text-primary)] transition-colors duration-200"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Spacer so page content isn't hidden behind fixed nav */}
      <div className="h-16" aria-hidden="true" />

      {/* ── Mobile Full-screen Overlay ────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            variants={shouldReduce ? mobileMenuReducedVariants : mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-40 flex flex-col lg:hidden"
            style={{ background: "var(--mk-bg-primary)" }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Mobile menu header row */}
            <div className="flex items-center justify-between px-6 h-16 border-b border-[var(--mk-border)]">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 font-extrabold text-[var(--mk-text-primary)]"
              >
                <div className="w-7 h-7 overflow-hidden">
                  <Logo />
                </div>
                {SiteConfig.name}
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center w-9 h-9 rounded-[var(--mk-radius-sm)] text-[var(--mk-text-secondary)] hover:bg-[var(--mk-bg-elevated)] transition-colors duration-200"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mobile nav links */}
            <nav className="flex flex-col px-6 pt-8 gap-2 flex-1" aria-label="Mobile navigation">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.label}
                  custom={i}
                  variants={shouldReduce ? undefined : mobileLinkVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block py-3 text-lg font-medium text-[var(--mk-text-secondary)] hover:text-[var(--mk-text-primary)] border-b border-[var(--mk-border)] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              {/* Mobile CTA buttons */}
              <motion.div
                custom={NAV_LINKS.length}
                variants={shouldReduce ? undefined : mobileLinkVariants}
                initial="hidden"
                animate="visible"
                className="mt-8 flex flex-col gap-3"
              >
                {/* Theme toggle - mobile */}
                {mounted && (
                  <button
                    onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                    className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-[var(--mk-text-secondary)] rounded-[var(--mk-radius-md)] border border-[var(--mk-border)] hover:border-[var(--mk-border-bright)] hover:text-[var(--mk-text-primary)] transition-all duration-200"
                    aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
                  >
                    {resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                    {resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}
                  </button>
                )}
                <Link
                  href={SiteConfig.userAppUrl}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center py-3 text-sm font-medium text-[var(--mk-text-secondary)] rounded-[var(--mk-radius-md)] border border-[var(--mk-border)] hover:border-[var(--mk-border-bright)] hover:text-[var(--mk-text-primary)] transition-all duration-200"
                >
                  Sign In
                </Link>
                <button
                  onClick={() => { setMobileOpen(false); onGetStartedClick(); }}
                  disabled={isLoadingCta || isLoginLoading}
                  className="flex items-center justify-center py-3 text-sm font-semibold text-white rounded-[var(--mk-radius-md)] bg-[var(--mk-brand)] hover:bg-[var(--mk-brand-glow)] transition-colors duration-200 disabled:opacity-50"
                >
                  {isLogged ? "Go to app" : "Get started"}
                </button>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
