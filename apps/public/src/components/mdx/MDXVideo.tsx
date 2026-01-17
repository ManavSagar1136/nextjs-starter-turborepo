"use client";

import React from "react";

import HeroVideoDialog from "@buildbase/magicui/components/hero-video-dialog";

/**
 * MDXVideo component for rendering videos in MDX content.
 * Provides video dialog functionality with thumbnail preview.
 */
const MDXVideo = ({
  src,
  poster,
  alt,
  ...props
}: React.VideoHTMLAttributes<HTMLVideoElement> & { alt?: string }) => {
  // Show placeholder in editor preview if src is missing
  if (!src || typeof src !== "string") {
    return (
      <div className="my-8 p-8 border-2 border-dashed border-muted rounded-lg text-center">
        <div className="text-muted-foreground text-sm">
          <p className="font-medium mb-2">CustomVideo Component</p>
          <p>Add a src prop to preview the video</p>
        </div>
      </div>
    );
  }

  const thumbnailUrl = typeof poster === "string" ? poster : "";

  return (
    <div className="my-8">
      <HeroVideoDialog
        videoSrc={src}
        thumbnailSrc={thumbnailUrl}
        thumbnailAlt={alt || "Video thumbnail"}
        animationStyle="from-center"
        className="w-full"
        {...props}
      />
      {alt && (
        <div className="mt-2 text-center text-sm text-muted-foreground">
          {alt}
        </div>
      )}
    </div>
  );
};

export default MDXVideo;
