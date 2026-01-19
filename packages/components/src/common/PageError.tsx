interface PageErrorProps {
  subTitle: string;
}

export const PageError = ({ subTitle }: PageErrorProps) => {
  return (
    <div className="container mx-auto flex h-full w-full flex-col items-center justify-center gap-5 rounded-[10px] p-5 py-10 text-lg md:gap-10 md:p-10 md:py-20">
      <img src={"/icon/404.svg"} height={250} width={250} alt="404 Image" title="404 Image" />
      <p className="text-primary/50 max-w-3xl text-center text-lg capitalize md:text-xl">{subTitle}</p>
    </div>
  );
};
