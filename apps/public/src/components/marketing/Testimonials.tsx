"use client";

import React from "react";

import { Card, CardContent } from "@buildbase/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@buildbase/ui/carousel";

import { SiteConfig } from "@/config";
import { cn } from "@buildbase/ui/lib/utils";

import HeaderCard from "../ui/HeaderCard";
import { ITestimonialItemProps, TestimonialItem } from "./TestimonialItem";

export const testimonials: ITestimonialItemProps[] = [
  {
    text: `Before using ${SiteConfig.name}, our workflows were scattered and slow. Now everything is streamlined and our team ships faster than ever.`,
    name: "Alex Thompson",
    highlightSentences: ["our team ships faster than ever"],
    job: "Head of Engineering at CloudNest",
    pictureUrl: "https://i.pravatar.cc/150?u=a042581f4e29026704h",
    company: "CloudNest",
  },
  {
    text: `${SiteConfig.name} helped us scale without increasing operational complexity. It feels like the platform was built exactly for teams like ours.`,
    name: "Priya Sharma",
    highlightSentences: ["scale without increasing operational complexity"],
    job: "Director of Operations at ScaleOps",
    pictureUrl: "https://i.pravatar.cc/150?u=a042581f4e29026704i",
    company: "ScaleOps",
  },
  {
    text: `We onboarded our entire organization to ${SiteConfig.name} in days, not weeks. The UX is intuitive and the impact was immediate.`,
    name: "Michael Chen",
    highlightSentences: ["in days, not weeks"],
    job: "Product Lead at NovaTech",
    pictureUrl: "https://i.pravatar.cc/150?u=a042581f4e29026704j",
    company: "NovaTech",
  },
  {
    text: `From day one, ${SiteConfig.name} delivered real business value. It's now a core part of how we operate and grow.`,
    name: "Sarah Williams",
    highlightSentences: ["a core part of how we operate and grow"],
    job: "VP of Growth at Elevate Labs",
    pictureUrl: "https://i.pravatar.cc/150?u=a042581f4e29026704k",
    company: "Elevate Labs",
  },
];

const Testimonials = () => {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

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
    <section
      className="flex flex-col items-center justify-center w-full max-w-7xl mx-auto"
      aria-label="Customer testimonials"
    >
      <HeaderCard
        mainTitle={<>You&apos;re in good company</>}
        subTitle="Trusted by industry leaders and growing teams worldwide"
      />

      {/* Carousel Container */}
      <div className="relative w-full max-w-3xl mx-auto">
        <Carousel
          setApi={setApi}
          className="w-full"
          opts={{
            align: "start",
          }}
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {testimonials.map((testimonial, index) => (
              <CarouselItem
                key={index}
                className="pl-2 md:pl-4 basis-full cursor-grab"
              >
                <Card className="border-2 hover:border-brand-200 dark:hover:border-brand-800 transition-colors duration-300 shadow-lg hover:shadow-xl">
                  <CardContent className="p-8">
                    <TestimonialItem
                      text={testimonial.text}
                      name={testimonial.name}
                      highlightSentences={testimonial.highlightSentences}
                      job={testimonial.job}
                      pictureUrl={testimonial.pictureUrl}
                      company={testimonial.company}
                    />
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Navigation Arrows */}
          <div className="hidden md:block">
            <CarouselPrevious className="left-0 md:-left-12 lg:-left-16 h-10 w-10 border-2 shadow-md hover:shadow-lg transition-shadow" />
            <CarouselNext className="right-0 md:-right-12 lg:-right-16 h-10 w-10 border-2 shadow-md hover:shadow-lg transition-shadow" />
          </div>
        </Carousel>

        {/* Pagination Dots */}
        <div className="flex items-center justify-center gap-2 mt-8 md:mt-12">
          {Array.from({ length: count }).map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => scrollTo(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                "h-2.5 w-2.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2",
                current === index + 1
                  ? "bg-brand-600 dark:bg-brand-400 w-8"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50",
              )}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={current === index + 1 ? "true" : "false"}
              tabIndex={0}
            />
          ))}
        </div>

        {/* Slide Counter */}
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">{current}</span> of{" "}
            <span className="font-medium">{count}</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
