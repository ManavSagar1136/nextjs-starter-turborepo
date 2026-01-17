"use client";

import React from "react";
import { Star, Quote } from "lucide-react";
import { cn } from "../../lib/utils";
import { Card, CardContent } from "./card";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Badge } from "./badge";

export interface Testimonial {
  id: string;
  content: string;
  author: {
    name: string;
    role: string;
    company?: string;
    avatar?: string;
  };
  rating?: number;
  featured?: boolean;
}

export interface TestimonialsProps {
  testimonials: Testimonial[];
  className?: string;
  variant?: "default" | "carousel" | "grid";
  showRating?: boolean;
  showQuote?: boolean;
}

export function Testimonials({
  testimonials,
  className,
  variant = "default",
  showRating = true,
  showQuote = true,
}: TestimonialsProps) {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={cn("h-4 w-4", i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300")} />
    ));
  };

  const renderTestimonial = (testimonial: Testimonial) => (
    <Card key={testimonial.id} className={cn("h-full", testimonial.featured && "ring-primary ring-2")}>
      <CardContent className="p-6">
        {testimonial.featured && (
          <Badge className="mb-4" variant="secondary">
            Featured
          </Badge>
        )}

        {showQuote && <Quote className="text-muted-foreground mb-4 h-8 w-8" />}

        <blockquote className="mb-4 text-lg">&quot;{testimonial.content}&quot;</blockquote>

        {showRating && testimonial.rating && (
          <div className="mb-4 flex items-center gap-1">{renderStars(testimonial.rating)}</div>
        )}

        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={testimonial.author.avatar} />
            <AvatarFallback>
              {testimonial.author.name
                .split(" ")
                .map(n => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{testimonial.author.name}</p>
            <p className="text-muted-foreground text-sm">
              {testimonial.author.role}
              {testimonial.author.company && ` at ${testimonial.author.company}`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (variant === "carousel") {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex gap-4 overflow-x-auto pb-4">{testimonials.map(renderTestimonial)}</div>
      </div>
    );
  }

  if (variant === "grid") {
    return (
      <div className={cn("grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3", className)}>
        {testimonials.map(renderTestimonial)}
      </div>
    );
  }

  return <div className={cn("space-y-6", className)}>{testimonials.map(renderTestimonial)}</div>;
}
