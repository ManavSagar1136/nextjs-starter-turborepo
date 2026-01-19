"use client";

import React from "react";
import { Button } from "@buildbase/ui/button";
import { cn } from "@buildbase/ui/lib/utils";
import { AppIcon } from "./AppIcon";
import { SiteConfig as SharedConfig } from "@buildbase/utils/config";

interface NotLoggedInProps {
  /**
   * The main title displayed on the component
   * @default "Welcome back to Buildbase"
   */
  title?: string;

  /**
   * The description text displayed below the title
   * @default "Login to your account to continue managing your content and websites and applications"
   */
  description?: string;

  /**
   * The text displayed on the login button
   * @default "Login"
   */
  buttonText?: string;

  /**
   * Handler function called when the login button is clicked
   */
  onLoginClick?: () => void;

  /**
   * Custom className for the container
   */
  className?: string;

  /**
   * Custom app name to replace "Buildbase" in the default title
   */
  appName?: string;
}

export const NotLoggedIn = ({
  title = SharedConfig.login.title,
  description = SharedConfig.login.description,
  buttonText = SharedConfig.login.buttonText,
  onLoginClick,
  className,
}: NotLoggedInProps) => {
  const handleLoginClick = () => {
    if (onLoginClick) {
      onLoginClick();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleLoginClick();
    }
  };

  return (
    <div
      className={cn(
        "flex min-h-[400px] w-full flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50/50 p-8 shadow-lg md:p-12",
        className
      )}
    >
      {/* App Icon Container */}
      <div className="mb-8 flex items-center justify-center">
        <AppIcon size="lg" />
      </div>

      {/* Title */}
      <h1 className="mb-4 text-center text-2xl font-bold text-slate-900 md:text-3xl">{title}</h1>

      {/* Description */}
      <p className="mb-8 max-w-2xl text-center text-base text-slate-600 md:text-lg">{description}</p>

      {/* Login Button */}
      <Button
        onClick={handleLoginClick}
        onKeyDown={handleKeyDown}
        variant="default"
        size="lg"
        className="bg-slate-700 px-8 py-6 text-white hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-500"
        tabIndex={0}
        aria-label={buttonText}
      >
        {buttonText}
      </Button>
    </div>
  );
};

export default NotLoggedIn;
