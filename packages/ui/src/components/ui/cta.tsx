import * as React from "react";
import { ArrowRight, ExternalLink } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface CTAProps {
  title: string;
  description?: string;
  primaryAction: {
    label: string;
    href?: string;
    onClick?: () => void;
    external?: boolean;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
    external?: boolean;
  };
  className?: string;
  variant?: "default" | "card" | "centered" | "split";
  backgroundImage?: string;
}

export function CTA({
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
  variant = "default",
  backgroundImage,
}: CTAProps) {
  const content = (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        {description && <p className="text-muted-foreground max-w-2xl text-lg">{description}</p>}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Button size="lg" className="group" asChild={!!primaryAction.href}>
          {primaryAction.href ? (
            <a href={primaryAction.href} target={primaryAction.external ? "_blank" : undefined}>
              {primaryAction.label}
              {primaryAction.external ? (
                <ExternalLink className="ml-2 h-4 w-4" />
              ) : (
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              )}
            </a>
          ) : (
            <button onClick={primaryAction.onClick}>
              {primaryAction.label}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          )}
        </Button>

        {secondaryAction && (
          <Button variant="outline" size="lg" asChild={!!secondaryAction.href}>
            {secondaryAction.href ? (
              <a href={secondaryAction.href} target={secondaryAction.external ? "_blank" : undefined}>
                {secondaryAction.label}
                {secondaryAction.external && <ExternalLink className="ml-2 h-4 w-4" />}
              </a>
            ) : (
              <button onClick={secondaryAction.onClick}>{secondaryAction.label}</button>
            )}
          </Button>
        )}
      </div>
    </div>
  );

  if (variant === "card") {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-8">{content}</CardContent>
      </Card>
    );
  }

  if (variant === "centered") {
    return (
      <section
        className={cn("py-16 sm:py-24", backgroundImage && "bg-cover bg-center bg-no-repeat", className)}
        style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : undefined}
      >
        {backgroundImage && <div className="bg-background/80 absolute inset-0" />}
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">{content}</div>
        </div>
      </section>
    );
  }

  if (variant === "split") {
    return (
      <section className={cn("py-16 sm:py-24", className)}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8">
            <div className="flex items-center">{content}</div>
            <div className="flex items-center justify-center">
              {backgroundImage ? (
                <img src={backgroundImage} alt="CTA image" className="rounded-lg shadow-2xl" />
              ) : (
                <div className="bg-muted flex h-96 w-full items-center justify-center rounded-lg">
                  <p className="text-muted-foreground">CTA Image</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn("py-16 sm:py-24", backgroundImage && "bg-cover bg-center bg-no-repeat", className)}
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : undefined}
    >
      {backgroundImage && <div className="bg-background/80 absolute inset-0" />}
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">{content}</div>
      </div>
    </section>
  );
}
