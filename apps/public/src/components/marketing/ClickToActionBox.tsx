"use client";

import { TbArrowRight, TbCalendarDue, TbCircleCheck } from "react-icons/tb";

import { withPostLaunchOnly } from "@/components/hoc/launch/withLaunchStatus";
import { SparklesSiteNameText } from "@/components/SparklesSiteNameText";
import { Button } from "@buildbase/ui/button";

import { SiteConfig } from "@/config";
import { useState } from "react";

const ClickToActionBoxComponent = () => {
  const [isLoadingCta, setLoading] = useState(false);

  const onGetStartedClick = () => {
    setLoading(true);
    window.location.href = SiteConfig.userAppUrl;
  };

  return (
    <section className="flex flex-col items-center my-20">
      <div className="p-8 md:p-12 rounded-lg w-full max-w-4xl text-center bg-gradient-to-r from-brand-100 to-brand-300">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 text-gray-900">
          Start making money today.
        </h2>
        <p className="text-base sm:text-lg text-gray-700 font-medium my-2 mx-auto">
          Get started with <SparklesSiteNameText /> today.
          <br />
          Start making money with your audience.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mt-6">
          <Button
            onClick={onGetStartedClick}
            className="px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-transform"
            disabled={isLoadingCta}
          >
            Try FREE now
            <TbArrowRight className="transition-transform transform group-hover:translate-x-1" />
          </Button>

          <a
            href={SiteConfig.calendlyLink}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-brand-600 text-brand-600 hover:text-brand-700 hover:border-brand-700 px-6 py-3 rounded-lg flex items-center gap-2"
          >
            <TbCalendarDue />
            Book a demo
          </a>
        </div>

        <div className="flex flex-col md:flex-row justify-center items-center gap-6 mt-8 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <TbCircleCheck className="text-brand-600" />
            <span>Personalized onboarding</span>
          </div>
          <div className="flex items-center gap-2">
            <TbCircleCheck className="text-brand-600" />
            <span>Friendly pricing as you scale</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export const ClickToActionBox = withPostLaunchOnly(ClickToActionBoxComponent);
