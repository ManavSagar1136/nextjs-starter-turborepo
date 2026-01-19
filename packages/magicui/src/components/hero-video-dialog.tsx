/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { Play, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@buildbase/ui/lib/utils";

type AnimationStyle =
  | "from-bottom"
  | "from-center"
  | "from-top"
  | "from-left"
  | "from-right"
  | "fade"
  | "top-in-bottom-out"
  | "left-in-right-out";

interface HeroVideoProps {
  animationStyle?: AnimationStyle;
  videoSrc: string;
  thumbnailSrc: string;
  thumbnailAlt?: string;
  className?: string;
  videoType?: string;
  enableCrossOrigin?: boolean;
}

const animationVariants = {
  "from-bottom": {
    initial: { y: "100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 0 },
  },
  "from-center": {
    initial: { scale: 0.5, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.5, opacity: 0 },
  },
  "from-top": {
    initial: { y: "-100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "-100%", opacity: 0 },
  },
  "from-left": {
    initial: { x: "-100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "-100%", opacity: 0 },
  },
  "from-right": {
    initial: { x: "100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  "top-in-bottom-out": {
    initial: { y: "-100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 0 },
  },
  "left-in-right-out": {
    initial: { x: "-100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
  },
};

// Helper function to detect if URL is a direct video file or an embed URL
const isDirectVideoUrl = (url: string): boolean => {
  // Check if URL ends with video extensions
  const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi", ".mkv", ".m4v"];
  const lowerUrl = url.toLowerCase();

  // Check for direct video file extensions
  if (videoExtensions.some(ext => lowerUrl.includes(ext))) {
    return true;
  }

  // Check for common video hosting domains (these should use iframe)
  const embedDomains = ["youtube.com", "youtu.be", "vimeo.com", "dailymotion.com", "wistia.com"];
  if (embedDomains.some(domain => lowerUrl.includes(domain))) {
    return false;
  }

  // Check for cloud storage URLs (these are typically direct video files)
  const storageDomains = ["storage.googleapis.com", "cloudfront.net", "s3.amazonaws.com", "blob.core.windows.net"];
  if (storageDomains.some(domain => lowerUrl.includes(domain))) {
    return true;
  }

  // Default to iframe for embed URLs
  return false;
};

export default function HeroVideoDialog({
  animationStyle = "from-center",
  videoSrc,
  thumbnailSrc,
  thumbnailAlt = "Video thumbnail",
  className,
  videoType = "video/mp4",
  enableCrossOrigin = false,
}: HeroVideoProps) {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const selectedAnimation = animationVariants[animationStyle];
  const isDirectVideo = isDirectVideoUrl(videoSrc);

  const handleCloseVideo = () => {
    setIsVideoOpen(false);
    setVideoError(null);
    // Pause and reset video when closing (only for direct video)
    if (isDirectVideo && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    let errorMessage = "Video failed to load";

    if (!videoSrc) {
      errorMessage = "Video source is missing or empty";
    } else if (video.error) {
      switch (video.error.code) {
        case video.error.MEDIA_ERR_ABORTED:
          errorMessage = "Video loading was aborted";
          break;
        case video.error.MEDIA_ERR_NETWORK:
          errorMessage = "Network error while loading video";
          break;
        case video.error.MEDIA_ERR_DECODE:
          errorMessage = "Video decoding failed";
          break;
        case video.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = `Video format not supported (${videoType})`;
          break;
        default:
          errorMessage = "Unknown video error";
      }
    }

    console.error("Video error details:", {
      message: errorMessage,
      videoSrc,
      videoType,
      error: video.error,
      enableCrossOrigin,
    });

    setVideoError(errorMessage);
  };

  // Auto-play video when modal opens (only for direct video)
  useEffect(() => {
    if (isVideoOpen && isDirectVideo && videoRef.current) {
      videoRef.current.play().catch(error => {
        console.log("Auto-play was prevented:", error);
      });
    }
  }, [isVideoOpen, isDirectVideo]);

  const handleOpenVideo = () => {
    setIsVideoOpen(true);
    setVideoError(null);
  };

  return (
    <div className={cn("relative", className)}>
      <div className="group relative cursor-pointer" onClick={handleOpenVideo}>
        <img
          src={thumbnailSrc}
          alt={thumbnailAlt}
          width={1920}
          height={1080}
          className="w-full rounded-md border shadow-lg transition-all duration-200 ease-out group-hover:brightness-[0.8]"
        />
        <div className="absolute inset-0 flex scale-[0.9] items-center justify-center rounded-2xl transition-all duration-200 ease-out group-hover:scale-100">
          <div className="bg-brand-900/10 flex size-28 items-center justify-center rounded-full backdrop-blur-md">
            <div
              className={`from-brand-300 to-brand-500 relative flex size-20 scale-100 items-center justify-center rounded-full bg-gradient-to-b shadow-md transition-all duration-200 ease-out group-hover:scale-[1.2]`}
            >
              <Play
                className="size-8 scale-100 fill-white text-white transition-transform duration-200 ease-out group-hover:scale-105"
                style={{
                  filter: "drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06))",
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {isVideoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={handleCloseVideo}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md"
          >
            <motion.div
              {...selectedAnimation}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative mx-4 aspect-video w-full max-w-4xl md:mx-0"
              onClick={e => e.stopPropagation()}
            >
              <motion.button
                onClick={handleCloseVideo}
                className="bg-brand-900/50 dark:bg-brand-100/50 absolute -top-16 right-0 rounded-full p-2 text-xl text-white ring-1 backdrop-blur-md dark:text-black"
              >
                <XIcon className="size-5" />
              </motion.button>
              <div className="relative isolate z-[1] size-full overflow-hidden rounded-2xl border-2 border-white">
                {isDirectVideo ? (
                  // Render video tag for direct video files
                  videoError ? (
                    <div className="flex size-full items-center justify-center rounded-2xl bg-black/90 p-8 text-center">
                      <div className="space-y-4">
                        <div className="text-xl font-semibold text-red-400">Failed to Load Video</div>
                        <div className="text-sm text-white/80">{videoError}</div>
                        <div className="text-xs text-white/60">Please check the video source and try again.</div>
                      </div>
                    </div>
                  ) : (
                    <video
                      ref={videoRef}
                      className="size-full rounded-2xl"
                      controls
                      controlsList="nodownload"
                      playsInline
                      preload="metadata"
                      poster={thumbnailSrc}
                      autoPlay
                      {...(enableCrossOrigin && { crossOrigin: "anonymous" })}
                      onError={handleVideoError}
                    >
                      <source src={videoSrc} type={videoType} />
                      Your browser does not support the video tag.
                    </video>
                  )
                ) : (
                  // Render iframe for embed URLs (YouTube, Vimeo, etc.)
                  <iframe
                    src={videoSrc}
                    className="size-full rounded-2xl"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  ></iframe>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
