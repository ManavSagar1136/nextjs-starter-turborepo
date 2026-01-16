import React from "react";

const PageError = ({ subTitle }: { subTitle: string }) => {
  return (
    <div className="text-lg w-full container mx-auto rounded-[10px] p-5 py-10 md:py-20 md:p-10 flex justify-center h-full items-center flex-col gap-5 md:gap-10">
      <img
        src={"/icon/404.svg"}
        height={250}
        width={250}
        alt="404 Image"
        title="404 Image"
      />
      <p className="text-lg md:text-xl max-w-3xl text-center text-primary/50 capitalize">
        {subTitle}
      </p>
    </div>
  );
};

export default PageError;
