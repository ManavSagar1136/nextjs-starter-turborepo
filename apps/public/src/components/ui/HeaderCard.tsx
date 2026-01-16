"use client";

import React, { useEffect } from "react";
import AOS from "aos";

import "aos/dist/aos.css";

import { Routes } from "@/data/routes";

import CustomButton from "./custom-button";
import { H1, H2 } from "./H1H6";

export const HeadingTag = ({
  h1,
  children,
  ...rest
}: {
  h1: boolean;
  children: React.ReactNode;
  [x: string]: any;
}) => {
  return h1 ? <H1 {...rest}>{children}</H1> : <H2 {...rest}>{children}</H2>;
};

const HeaderCard = ({
  mainTitle,
  subTitle,
  buttonText,
  button,
  link,
  h1 = false,
}: {
  mainTitle: string | React.ReactNode;
  subTitle: string | React.ReactNode;
  buttonText?: string;
  button?: boolean;
  link?: string;
  h1?: boolean;
}) => {
  useEffect(() => {
    AOS.init();
  }, []);
  return (
    <div
      data-aos="fade-up"
      className="flex flex-col items-center justify-center"
    >
      <HeadingTag
        h1={h1}
        className="mx-auto mb-6 max-w-4xl text-center text-2xl font-bold capitalize leading-tight text-primary md:text-[54px]"
      >
        {mainTitle}
      </HeadingTag>
      <p className="mx-auto mb-8 max-w-2xl text-center text-lg text-primary sm:text-xl">
        {subTitle}
      </p>
      {button && (
        <CustomButton
          link={true}
          href={link || Routes.root}
          classNames="px-6 py-6 flex justify-center items-center gap-2 "
        >
          {buttonText}
        </CustomButton>
      )}
    </div>
  );
};

export default HeaderCard;
