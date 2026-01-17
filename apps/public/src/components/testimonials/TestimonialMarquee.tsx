"use client";

import { Heart, MessageCircle, X } from "lucide-react";

import { Marquee } from "@buildbase/magicui/components/marquee";
import { Avatar, AvatarFallback, AvatarImage } from "@buildbase/ui/avatar";
import { Badge } from "@buildbase/ui/badge";
import { Card, CardContent } from "@buildbase/ui/card";

import { useIsMobile } from "@buildbase/ui/hooks/use-mobile";

export interface ITestimonial {
  id: number;
  author: {
    name: string;
    username: string;
    avatar: string;
    verified: boolean;
    role?: string;
  };
  content: string;
  date: string;
  metrics: {
    likes: number;
    replies: number;
  };
}

interface TestimonialMarqueeProps {
  testimonials: ITestimonial[];
}

const ReviewCard = (testimonial: ITestimonial) => {
  return (
    <Card key={testimonial.id} className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={testimonial.author.avatar} alt={testimonial.author.name} />
            <AvatarFallback>{testimonial.author.name[0]}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="truncate font-semibold">{testimonial.author.name}</div>
              {testimonial.author.verified && (
                <Badge variant="secondary" className="bg-brand-100 text-brand-700 hover:bg-brand-100">
                  <X className="h-3 w-3" />
                </Badge>
              )}
            </div>
            <div className="text-muted-foreground truncate text-sm">{testimonial.author.username}</div>
            {testimonial.author.role && (
              <div className="text-muted-foreground mt-1 text-sm">{testimonial.author.role}</div>
            )}
          </div>
        </div>
        <div className="mt-4 space-y-2 whitespace-pre-wrap text-sm">{testimonial.content}</div>
        <div className="text-muted-foreground mt-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            {testimonial.metrics.likes}
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            {testimonial.metrics.replies}
          </div>
          <div className="text-xs">{testimonial.date}</div>
        </div>
      </CardContent>
    </Card>
  );
};

const TestimonialMarquee = ({ testimonials }: TestimonialMarqueeProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="relative flex h-[500px] w-full flex-row items-center justify-center overflow-hidden">
      {isMobile ? (
        <Marquee pauseOnHover vertical className="[--duration:20s]">
          {testimonials.map(review => (
            <ReviewCard key={review.author.username} {...review} />
          ))}
        </Marquee>
      ) : (
        <>
          <Marquee pauseOnHover vertical className="[--duration:20s]">
            {testimonials
              .filter((x, index) => index % 2 == 0)
              .map(review => (
                <ReviewCard key={review.author.username} {...review} />
              ))}
          </Marquee>
          <Marquee reverse pauseOnHover vertical className="[--duration:20s]">
            {testimonials
              .filter((x, index) => index % 2 == 1)
              .map(review => (
                <ReviewCard key={review.author.username} {...review} />
              ))}
          </Marquee>
        </>
      )}
      <div className="dark:from-background pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white"></div>
      <div className="dark:from-background pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white"></div>
    </div>
  );
};

export default TestimonialMarquee;
