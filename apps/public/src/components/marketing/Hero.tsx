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
import { useState } from "react";

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

export const Hero = ({
  showUsers = true,
  showCta = true,
  showBookDemo = true,
}: HeroProps) => {
  const [isLoadingCta, setLoading] = useState(false);
  const isProductLive = isProductLaunched();

  // Hide CTA button when product is not launched
  const shouldShowCta = showCta && isProductLive;

  const handleGetStartedClick = () => {
    setLoading(true);
    window.location.href = SiteConfig.userAppUrl;
  };

  const handleBookDemoClick = () => {
    window.open(SiteConfig.calendlyLink, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.div
      className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Left Content - Text & CTAs */}
      <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left w-full">
        {/* Headline */}
        <motion.div variants={itemVariants} className="w-full">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
            <span className="block">
              <AuroraText>Make money</AuroraText>
            </span>
            <span className="block text-foreground mt-2">while you sleep</span>
          </h1>
        </motion.div>

        {/* Subheadline */}
        <motion.div variants={itemVariants} className="w-full mb-8">
          <TextAnimate
            animation="blurInUp"
            by="word"
            className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed"
          >
            Launch faster and start making money today. Build your SaaS with
            confidence using our enterprise-ready developer template.
          </TextAnimate>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col max-lg:justify-center sm:flex-row items-center gap-4 w-full mb-10 lg:mb-12"
        >
          {shouldShowCta && (
            <Button
              onClick={handleGetStartedClick}
              size="lg"
              variant="brand"
              disabled={isLoadingCta}
              className={cn(
                "group relative h-12 px-8 text-base font-semibold shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 transition-all duration-300",
                "hover:scale-105 active:scale-100",
              )}
              aria-label="Start free trial"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="size-4" />
                Try FREE now
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
                "h-12 px-8 text-base font-medium border-2 hover:bg-accent/50 transition-all duration-300",
                "hover:scale-105 active:scale-100",
              )}
              aria-label="Schedule a demo call"
            >
              <TbCalendarDue className="size-5 mr-2" />
              Talk to us
            </Button>
          )}
        </motion.div>

        {/* Social Proof */}
        {showUsers && (
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center gap-4 w-full pt-4 border-t border-border/50"
          >
            <div className="flex items-center gap-3">
              <AvatarCircles numPeople={999} avatarUrls={userBy} />
              <div className="flex flex-col">
                <p className="text-sm font-semibold text-foreground leading-tight">
                  Trusted by{" "}
                  <span className="inline-flex items-baseline">
                    <NumberTicker
                      value={1000}
                      className="font-bold text-foreground"
                    />
                    <span className="ml-1">+</span>
                  </span>{" "}
                  developers
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <TbStarFilled
                      key={i}
                      className="size-4 text-yellow-500 fill-yellow-500"
                      aria-hidden="true"
                    />
                  ))}
                  <span className="ml-2 text-xs text-muted-foreground font-medium">
                    5.0 rating
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Right Content - Hero Image */}
      <motion.div
        variants={imageVariants}
        className="relative flex-shrink-0 w-full lg:w-[45%] xl:w-[40%] flex justify-center items-center"
      >
        <div className="relative w-full max-w-[500px] aspect-square">
          {/* Image container with subtle border */}
          <div className="relative w-full h-full rounded-2xl overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://placehold.co/500x500"
              alt="Product showcase"
              width={500}
              height={500}
              className="w-full h-full object-cover"
              loading="eager"
              fetchPriority="high"
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
