import * as React from "react";
import { ArrowRight, Play } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";

export interface HeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  primaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  videoAction?: {
    label: string;
    onClick?: () => void;
  };
  backgroundImage?: string;
  className?: string;
  variant?: "default" | "centered" | "split";
}

export function Hero({
  title,
  subtitle,
  description,
  primaryAction,
  secondaryAction,
  videoAction,
  backgroundImage,
  className,
  variant = "default",
}: HeroProps) {
  const content = (
    <div className="space-y-6">
      {subtitle && <p className="text-primary text-lg font-medium">{subtitle}</p>}

      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">{title}</h1>

      {description && <p className="text-muted-foreground max-w-2xl text-xl">{description}</p>}

      <div className="flex flex-col gap-4 sm:flex-row">
        {primaryAction && (
          <Button size="lg" className="group" asChild={!!primaryAction.href}>
            {primaryAction.href ? (
              <a href={primaryAction.href}>
                {primaryAction.label}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            ) : (
              <button onClick={primaryAction.onClick}>
                {primaryAction.label}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            )}
          </Button>
        )}

        {secondaryAction && (
          <Button variant="outline" size="lg" asChild={!!secondaryAction.href}>
            {secondaryAction.href ? (
              <a href={secondaryAction.href}>{secondaryAction.label}</a>
            ) : (
              <button onClick={secondaryAction.onClick}>{secondaryAction.label}</button>
            )}
          </Button>
        )}

        {videoAction && (
          <Button variant="ghost" size="lg" onClick={videoAction.onClick}>
            <Play className="mr-2 h-4 w-4" />
            {videoAction.label}
          </Button>
        )}
      </div>
    </div>
  );

  if (variant === "centered") {
    return (
      <section
        className={cn("relative py-24 sm:py-32", backgroundImage && "bg-cover bg-center bg-no-repeat", className)}
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
      <section className={cn("py-24 sm:py-32", className)}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8">
            <div className="flex items-center">{content}</div>
            <div className="flex items-center justify-center">
              {backgroundImage ? (
                <img src={backgroundImage} alt="Hero image" className="rounded-lg shadow-2xl" />
              ) : (
                <div className="bg-muted flex h-96 w-full items-center justify-center rounded-lg">
                  <p className="text-muted-foreground">Hero Image</p>
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
      className={cn("relative py-24 sm:py-32", backgroundImage && "bg-cover bg-center bg-no-repeat", className)}
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : undefined}
    >
      {backgroundImage && <div className="bg-background/80 absolute inset-0" />}
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">{content}</div>
      </div>
    </section>
  );
}
