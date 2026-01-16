"use client";

import { Mail } from "lucide-react";

import { Accordion } from "@buildbase/ui/accordion";
import { Button } from "@buildbase/ui/button";

import { SiteConfig } from "@/config";

import HeaderCard from "../ui/HeaderCard";
import { FAQQuestion, FAQQuestionProps } from "./FAQquestion";

export const FAQ = ({ faqs }: { faqs: FAQQuestionProps[] }) => {
  const handleContactSupport = () => {
    window.location.href = `mailto:${SiteConfig.supportEmail}`;
  };

  return (
    <div className="max-w-4xl mx-auto flex items-center justify-center rounded-lg flex-col space-y-12 px-4 sm:px-6 lg:px-8">
      <HeaderCard
        mainTitle="Frequently asked questions"
        subTitle="Find answers to the most common questions about our product, pricing, features, and support."
        h1
      />

      <div className="w-full">
        <Accordion
          type="single"
          collapsible
          className="w-full"
          aria-label="Frequently asked questions"
        >
          {faqs.map((data, index) => {
            return <FAQQuestion {...data} key={`faq-item-${index}`} />;
          })}
        </Accordion>
      </div>

      <div className="w-full pt-4 border-t border-border/60">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <p className="text-sm text-muted-foreground text-center">
            Still have questions?
          </p>
          <Button
            variant="outline"
            size="default"
            onClick={handleContactSupport}
            className="group border-2 hover:bg-brand-50 hover:border-brand-500 hover:text-brand-700 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Contact support team"
          >
            <Mail className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
            Contact support
          </Button>
        </div>
      </div>
    </div>
  );
};
