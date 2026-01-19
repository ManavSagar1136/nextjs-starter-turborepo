"use client";

import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { IBlogPost } from "@/services/blogs";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@buildbase/ui/components/ui/carousel";

import { cn } from "@buildbase/ui/lib/utils";

import { Button } from "@buildbase/ui/components/ui/button";
import { FeaturedBlogPost } from "./FeaturedBlogPost";

const MAX_FEATURED_POSTS = 5;

interface FeaturedBlogPostSliderProps {
  posts: IBlogPost[];
}

export const FeaturedBlogPostSlider = ({
  posts,
}: FeaturedBlogPostSliderProps) => {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  const limitedPosts = posts.slice(0, MAX_FEATURED_POSTS);

  React.useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  const scrollTo = React.useCallback(
    (index: number) => {
      api?.scrollTo(index);
    },
    [api],
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent, index: number) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        scrollTo(index);
      }
    },
    [scrollTo],
  );

  return (
    <div>
      <div className="flex items-center gap-4 md:gap-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => api?.scrollPrev()}
          disabled={!api?.canScrollPrev()}
          className="shrink-0 max-md:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            loop: false, // <-- Disable infinite loop
          }}
          className="max-md:max-w-full"
        >
          <CarouselContent>
            {limitedPosts.map((post) => (
              <CarouselItem key={post.id} className="basis-full">
                <div className="px-2 h-full *:h-full *:*:h-full">
                  <FeaturedBlogPost post={post} disableHoverEffect />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <Button
          variant="outline"
          size="icon"
          onClick={() => api?.scrollNext()}
          disabled={!api?.canScrollNext()}
          className="shrink-0 max-md:hidden"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      {/* Pagination Dots */}
      {count > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: count }).map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => scrollTo(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                "h-2.5 w-2.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                current === index + 1
                  ? "bg-primary w-8"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50",
              )}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={current === index + 1 ? "true" : "false"}
              tabIndex={0}
            />
          ))}
        </div>
      )}
      {/* Slide Counter */}
      {count > 1 && (
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">{current}</span> of{" "}
            <span className="font-medium">{count}</span>
          </p>
        </div>
      )}
    </div>
  );
};
