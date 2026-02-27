import { TbRocket } from "react-icons/tb";

export const Logo = () => {
  return (
    <div
      className="w-7 h-7 rounded-lg flex items-center justify-center text-white bg-indigo-500"
    >
      <TbRocket size="18px" />
    </div>
  );
};

export const LogoSmall = () => {
  return (
    <div
      className="w-4.5 h-4.5 rounded flex items-center justify-center text-white bg-indigo-500"
    >
      <TbRocket size="14px" />
    </div>
  );
};
