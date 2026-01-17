import * as React from "react";

export const getImageURL = (src: string | undefined) => {
  if (!src) return "";
  return src.charAt(0) === "/" ? `/${src}` : src;
};

interface CustomImageProps extends React.DetailedHTMLProps<
  React.ImgHTMLAttributes<HTMLImageElement>,
  HTMLImageElement
> {
  src?: string;
}

export const CustomImage = ({ src, ...rest }: CustomImageProps) => {
  return <img src={getImageURL(src)} {...rest} />;
};
