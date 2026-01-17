import React from "react";

interface DocHeadersProps {
  mainTitle: string;
  subTitle: string;
}

export const DocHeaders = ({ mainTitle, subTitle }: DocHeadersProps) => {
  return (
    <div
      className="rounded-10 mt-[30px] flex w-full flex-col items-center justify-center gap-2 bg-cover p-5 md:gap-5 md:p-10"
      style={{ backgroundImage: `url("/subscribe-bg.svg")` }}
    >
      <h1 className="flex flex-col gap-2 text-center text-3xl font-bold md:text-5xl">
        <span className="capitalize">{mainTitle}</span>
        <span className="sr-only">{":"}</span>
        <span className="text-center text-base font-medium">{subTitle}</span>
      </h1>
    </div>
  );
};

export default DocHeaders;
