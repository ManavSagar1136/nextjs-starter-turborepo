"use client";

import React, { useEffect } from "react";
import AOS from "aos";

import "aos/dist/aos.css";

// Routes will be passed as a prop or use default "/"
const DEFAULT_ROOT_ROUTE = "/";
import { Button } from "@buildbase/ui/button";
import { Heading } from "@buildbase/ui/heading";

interface HeadingTagProps {
  h1: boolean;
  children: React.ReactNode;
  className?: string;
  [x: string]: any;
}

export const HeadingTag = ({ h1, children, className, ...rest }: HeadingTagProps) => {
  return (
    <Heading variant={h1 ? "h1" : "h2"} className={className} {...rest}>
      {children}
    </Heading>
  );
};

interface HeaderCardProps {
  mainTitle: string | React.ReactNode;
  subTitle: string | React.ReactNode;
  buttonText?: string;
  button?: boolean;
  link?: string;
  h1?: boolean;
}

export const HeaderCard = ({ mainTitle, subTitle, buttonText, button = false, link, h1 = false }: HeaderCardProps) => {
  useEffect(() => {
    AOS.init();
  }, []);

  return (
    <div data-aos="fade-up" className="flex flex-col items-center justify-center">
      <HeadingTag
        h1={h1}
        className="text-primary mx-auto mb-6 max-w-4xl text-center text-2xl font-bold capitalize leading-tight md:text-[54px]"
      >
        {mainTitle}
      </HeadingTag>
      <p className="text-primary mx-auto mb-8 max-w-2xl text-center text-lg sm:text-xl">{subTitle}</p>
      {button && (
        <Button asChild variant="secondary" className="flex items-center justify-center gap-2 px-6 py-6">
          <a href={link || DEFAULT_ROOT_ROUTE}>{buttonText}</a>
        </Button>
      )}
    </div>
  );
};

export default HeaderCard;
