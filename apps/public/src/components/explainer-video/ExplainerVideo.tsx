"use client";

import HeroVideoDialog from "@buildbase/magicui/components/hero-video-dialog";

export const ExplainerVideo = () => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Headline Section */}
      <div className="mb-8 sm:mb-10 lg:mb-12 text-center">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-foreground mb-3 tracking-tight">
          See how it works in under 2 minutes
        </h2>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Watch our quick demo to discover how you can start making money with
          our platform
        </p>
      </div>

      {/* Video Container */}
      <div className="relative w-full">
        <div className="relative mx-auto max-w-4xl">
          <HeroVideoDialog
            className="w-full"
            animationStyle="from-center"
            videoSrc=""
            thumbnailSrc="https://placehold.co/600x400"
            thumbnailAlt="Product explainer video showing how to make money with our platform"
          />
        </div>
      </div>
    </div>
  );
};
