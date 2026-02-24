"use client";

import { motion } from "framer-motion";
import { ArrowRightIcon, Sparkles } from "lucide-react";
import { TbCalendarDue, TbStarFilled } from "react-icons/tb";

import { AuroraText } from "@buildbase/magicui/components/aurora-text";
import { AvatarCircles } from "@buildbase/magicui/components/avatar-circles";
import { NumberTicker } from "@buildbase/magicui/components/number-ticker";
import { TextAnimate } from "@buildbase/magicui/components/text-animate";
import { Button } from "@buildbase/ui/button";

import { SiteConfig } from "@/config";
import { cn } from "@buildbase/ui/lib/utils";
import { isProductLaunched } from "@/lib/utils/launch-status";
import { useGetStarted } from "@/hooks/use-get-started";

type HeroProps = {
  showBookDemo?: boolean;
  showCta?: boolean;
  showUsers?: boolean;
};

const userBy = [
  {
    name: "Dharmendra Jagodana",
    imageUrl: "/users/dharmendra-jagodana.jpeg",
    profileUrl: "https://www.linkedin.com/in/dharmendra-jagodana-156246124/",
  },

  {
    name: "Dharmik Jagodana",
    imageUrl: "/users/dharmik-jagodana.jpeg",
    profileUrl: "https://www.linkedin.com/in/dharmikjagodana/",
  },
  {
    name: "Karupali Patel",
    imageUrl: "/users/krupali-patel.jpeg",
    profileUrl: "https://www.linkedin.com/in/krupali-patel-920961218/",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const imageVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const Hero = ({ showUsers = true, showCta = true, showBookDemo = true }: HeroProps) => {
  const { isLoadingCta, onGetStartedClick, isLogged } = useGetStarted();
  const isProductLive = isProductLaunched();

  // Hide CTA button when product is not launched
  const shouldShowCta = showCta && isProductLive;

  const handleGetStartedClick = () => {
    onGetStartedClick();
  };

  const handleBookDemoClick = () => {
    window.open(SiteConfig.calendlyLink, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.div
      className="mx-auto flex max-w-7xl flex-col items-center gap-12 lg:flex-row lg:gap-16"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Left Content - Text & CTAs */}
      <div className="flex w-full flex-1 flex-col items-center text-center lg:items-start lg:text-left">
        {/* Headline */}
        <motion.div variants={itemVariants} className="w-full">
          <h1 className="mb-6 text-4xl font-extrabold leading-[1.1] tracking-tight md:text-5xl lg:text-6xl">
            <span className="block">
              <AuroraText>Make money</AuroraText>
            </span>
            <span className="text-foreground mt-2 block">while you sleep</span>
          </h1>
        </motion.div>

        {/* Subheadline */}
        <motion.div variants={itemVariants} className="mb-8 w-full">
          <TextAnimate
            animation="blurInUp"
            by="word"
            className="text-muted-foreground mx-auto max-w-2xl text-lg leading-relaxed sm:text-xl md:text-2xl lg:mx-0"
          >
            Launch faster and start making money today. Build your SaaS with confidence using our enterprise-ready
            developer template.
          </TextAnimate>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          variants={itemVariants}
          className="mb-10 flex w-full flex-col items-center gap-4 max-lg:justify-center sm:flex-row lg:mb-12"
        >
          {shouldShowCta && (
            <Button
              onClick={handleGetStartedClick}
              size="lg"
              variant="brand"
              disabled={isLoadingCta}
              className={cn(
                "shadow-brand-500/25 hover:shadow-brand-500/30 group relative h-12 px-8 text-base font-semibold shadow-lg transition-all duration-300 hover:shadow-xl",
                "hover:scale-105 active:scale-100"
              )}
              aria-label={isLogged ? "Go to application" : "Start free trial"}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="size-4" />
                {isLogged ? "Go to app" : "Try FREE now"}
              </span>
              <ArrowRightIcon className="ml-2 size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          )}
          {showBookDemo && (
            <Button
              onClick={handleBookDemoClick}
              size="lg"
              variant="outline"
              className={cn(
                "hover:bg-accent/50 h-12 border-2 px-8 text-base font-medium transition-all duration-300",
                "hover:scale-105 active:scale-100"
              )}
              aria-label="Schedule a demo call"
            >
              <TbCalendarDue className="mr-2 size-5" />
              Talk to us
            </Button>
          )}
        </motion.div>

        {/* Social Proof */}
        {showUsers && (
          <motion.div
            variants={itemVariants}
            className="border-border/50 flex w-full flex-col items-center gap-4 border-t pt-4 sm:flex-row"
          >
            <div className="flex items-center gap-3">
              <AvatarCircles numPeople={999} avatarUrls={userBy} />
              <div className="flex flex-col">
                <p className="text-foreground text-sm font-semibold leading-tight">
                  Trusted by{" "}
                  <span className="inline-flex items-baseline">
                    <NumberTicker value={1000} className="text-foreground font-bold" />
                    <span className="ml-1">+</span>
                  </span>{" "}
                  developers
                </p>
                <div className="mt-1 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <TbStarFilled key={i} className="size-4 fill-yellow-500 text-yellow-500" aria-hidden="true" />
                  ))}
                  <span className="text-muted-foreground ml-2 text-xs font-medium">5.0 rating</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Right Content - Hero Image */}
      <motion.div
        variants={imageVariants}
        className="relative flex w-full flex-shrink-0 items-center justify-center lg:w-[45%] xl:w-[40%]"
      >
        <div className="relative aspect-square w-full max-w-[500px]">
          {/* Image container with subtle border */}
          <div className="border-border/50 bg-card/50 relative h-full w-full overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://placehold.co/500x500"
              alt="Product showcase"
              width={500}
              height={500}
              className="h-full w-full object-cover"
              loading="eager"
              fetchPriority="high"
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
