"use client";

import { ChevronRight } from "lucide-react";

import { AnimatedGradientText } from "@buildbase/magicui/components/animated-gradient-text";
import { TextAnimate } from "@buildbase/magicui/components/text-animate";
import { Button } from "@buildbase/ui/button";

import { cn } from "@buildbase/ui/lib/utils";
import { useGetStarted } from "@/hooks/use-get-started";

import { LazyImage } from "@buildbase/ui/lazy-image";

export type FeatureProps = {
  category: string;
  title: string;
  description: string;
  imageUrl: string;
  showCta: boolean;
  reverse?: boolean;
};

export const Feature = ({
  category,
  title,
  description,
  imageUrl,
  showCta,
  reverse = false,
}: FeatureProps) => {
  const { isLoadingCta, onGetStartedClick } = useGetStarted();

  return (
    <section
      className={cn(
        "group relative flex flex-col lg:flex-row items-center gap-8 lg:gap-12",
        "px-4 sm:px-6 lg:px-8 py-12 lg:py-12",
        "rounded-2xl lg:rounded-3xl",
        "dark:bg-white/20",
        "border border-gray-200/60",
        "shadow-sm hover:shadow-lg transition-all duration-500",
        "backdrop-blur-sm",
        reverse && "lg:flex-row-reverse",
      )}
    >
      {/* Decorative gradient overlay */}
      <div
        className={cn(
          "absolute inset-0 rounded-2xl lg:rounded-3xl",
          "bg-gradient-to-br from-brand-50/10 via-transparent to-pink-50/20",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          "pointer-events-none",
        )}
      />

      {/* Content Section */}
      <div
        className={cn(
          "relative z-10 flex flex-col items-start w-full lg:w-1/2",
          "space-y-4 lg:space-y-6",
        )}
      >
        {/* Category Badge */}
        <div className="inline-flex items-center">
          <span
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-semibold",
              "bg-gradient-to-r from-brand-100 to-pink-100",
              "text-brand-700 dark:text-brand-600",
              "border border-brand-200/50",
              "shadow-sm",
            )}
          >
            {category}
          </span>
        </div>

        {/* Title */}
        <h2
          className={cn(
            "text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-indigo-500 leading-tight",
          )}
        >
          {title}
        </h2>

        {/* Description */}
        <div className="w-full">
          <TextAnimate
            animation="blurInUp"
            by="character"
            className={cn(
              "text-base sm:text-lg text-slate-400 dark:text-slate-600",
              "leading-relaxed max-w-xl",
            )}
          >
            {description}
          </TextAnimate>
        </div>

        {/* CTA Button */}
        {showCta && (
          <div className="pt-2">
            <Button
              className={cn(
                "mt-2 flex items-center transition-all duration-300 p-0 mx-0",
                "hover:scale-105 active:scale-95",
              )}
              variant="ghost"
              onClick={onGetStartedClick}
              disabled={isLoadingCta}
            >
              <AnimatedGradientText>
                🎉 <hr className="mx-2 h-4 shrink-0 bg-gray-300" />
                <span
                  className={cn(
                    `inline animate-gradient bg-gradient-to-r from-orange-400 via-brand-400 to-pink-400 bg-clip-text bg-brand-400 text-transparent dark:text-indigo-500`,
                  )}
                >
                  Try FREE now
                </span>
                <ChevronRight className="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
              </AnimatedGradientText>
            </Button>
          </div>
        )}
      </div>

      {/* Image Section */}
      <div
        className={cn(
          "relative z-10 w-full lg:w-1/2",
          "flex items-center justify-center",
        )}
      >
        <div
          className={cn(
            "relative w-full max-w-xl",
            "rounded-xl lg:rounded-2xl",
            "overflow-hidden",
            "bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100",
            "border border-gray-200/80",
            "shadow-lg hover:shadow-xl transition-shadow duration-500",
            "group/image",
          )}
        >
          {/* Decorative gradient overlay on image container */}
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br",
              "from-brand-50/20 via-transparent to-pink-50/20",
              "opacity-0 group-hover/image:opacity-100",
              "transition-opacity duration-500",
              "pointer-events-none",
            )}
          />

          {/* Image */}
          <LazyImage
            src={imageUrl}
            alt={`${title} feature image`}
            width={600}
            height={400}
            className={cn(
              "w-full h-auto",
              "object-cover",
              "transition-transform duration-700",
              "group-hover/image:scale-[1.02]",
            )}
          />

          {/* Subtle shine effect */}
          <div
            className={cn(
              "absolute inset-0",
              "bg-gradient-to-r from-transparent via-white/10 to-transparent",
              "-translate-x-full group-hover/image:translate-x-full",
              "transition-transform duration-1000 ease-in-out",
              "pointer-events-none",
            )}
          />
        </div>
      </div>
    </section>
  );
};
