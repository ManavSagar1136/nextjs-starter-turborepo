"use client";

import { Mail } from "lucide-react";

import { Accordion } from "@buildbase/ui/accordion";
import { Button } from "@buildbase/ui/button";

import { SiteConfig } from "@/config";

import { HeaderCard } from "@buildbase/components/common/header-card";
import { FAQQuestion, FAQQuestionProps } from "./FAQquestion";

export const FAQ = ({ faqs }: { faqs: FAQQuestionProps[] }) => {
  const handleContactSupport = () => {
    window.location.href = `mailto:${SiteConfig.supportEmail}`;
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center justify-center space-y-12 rounded-lg px-4 sm:px-6 lg:px-8">
      <HeaderCard
        mainTitle="Frequently asked questions"
        subTitle="Find answers to the most common questions about our product, pricing, features, and support."
        h1
      />

      <div className="w-full">
        <Accordion type="single" collapsible className="w-full" aria-label="Frequently asked questions">
          {faqs.map((data, index) => {
            return <FAQQuestion {...data} key={`faq-item-${index}`} />;
          })}
        </Accordion>
      </div>

      <div className="border-border/60 w-full border-t pt-4">
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <p className="text-muted-foreground text-center text-sm">Still have questions?</p>
          <Button
            variant="outline"
            size="default"
            onClick={handleContactSupport}
            className="hover:bg-brand-50 hover:border-brand-500 hover:text-brand-700 focus-visible:ring-brand-500 group border-2 transition-all duration-200 focus-visible:ring-2"
            aria-label="Contact support team"
          >
            <Mail className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            Contact support
          </Button>
        </div>
      </div>
    </div>
  );
};
