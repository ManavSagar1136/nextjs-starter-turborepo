"use client";

import Image from "next/image";
import { TbQuote, TbStarFilled } from "react-icons/tb";

import { AuroraText } from "@buildbase/magicui/components/aurora-text";

const highlightText = (
  text: string,
  highlightSentences: string[] | undefined = [],
) => {
  const textChunks = text.split(".").filter((chunk) => chunk.trim() !== "");

  return textChunks.map((chunk, index) => {
    const isHighlighted = highlightSentences?.includes(chunk.trim());
    return (
      <span key={index} className={`${isHighlighted ? "font-semibold" : ""}`}>
        {isHighlighted ? <AuroraText> {chunk}.</AuroraText> : `${chunk}.`}
      </span>
    );
  });
};

export type ITestimonialItemProps = {
  text: string;
  name: string;
  job: string;
  pictureUrl: string;
  highlightSentences?: string[];
  company?: string;
};

export const TestimonialItem = ({
  text,
  name,
  job,
  pictureUrl,
  highlightSentences,
  company,
}: ITestimonialItemProps) => {
  const textChunks = highlightText(text, highlightSentences);

  // Extract company from job if not provided separately
  const companyName =
    company || (job.includes(" at ") ? job.split(" at ")[1] : null);
  const roleTitle =
    companyName && job.includes(" at ") ? job.split(" at ")[0] : job;

  return (
    <div className="w-full max-w-[700px] mx-auto space-y-8">
      {/* Quote Icon and Text */}
      <div className="relative">
        {/* Decorative Quote Icon */}
        <div className="absolute -top-2 -left-2 opacity-10">
          <TbQuote className="text-brand-500 h-20 w-20" />
        </div>

        {/* Main Quote Text */}
        <div className="relative pl-8">
          <blockquote className="text-xl md:text-2xl leading-relaxed font-light text-slate-900/90 dark:text-slate-50/80">
            {textChunks}
          </blockquote>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />

      {/* Trust Signals: Stars, Author, Company */}
      <div className="space-y-6">
        {/* Star Rating */}
        <div
          className="flex items-center space-x-1"
          aria-label="5 out of 5 stars"
        >
          {[...Array(5)].map((_, i) => (
            <TbStarFilled
              key={i}
              className="h-5 w-5 text-yellow-500 fill-yellow-500"
              aria-hidden="true"
            />
          ))}
        </div>

        {/* Author Information */}
        <div className="flex items-center space-x-4">
          {/* Avatar with enhanced styling */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-brand-100 dark:ring-brand-900 shadow-sm">
              <Image
                src={pictureUrl}
                alt={`${name}'s profile picture`}
                width={64}
                height={64}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            {/* Verified indicator dot */}
            <div
              className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-dark-surface ring-1 ring-green-500/20"
              aria-label="Verified"
            />
          </div>

          {/* Name, Role, and Company */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base text-slate-900 dark:text-slate-50">
              {name}
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-600 mt-0.5">{roleTitle}</p>
            {companyName && (
              <p className="text-sm font-medium text-brand-600 dark:text-brand-400 mt-1">
                {companyName}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
