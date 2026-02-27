import { TbRocket } from "react-icons/tb";

export const Logo = () => {
  return (
    <div
      className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
      style={{ background: "var(--mk-brand)" }}
    >
      <TbRocket size="18px" />
    </div>
  );
};

export const LogoSmall = () => {
  return (
    <div
      className="w-4.5 h-4.5 rounded flex items-center justify-center text-white"
      style={{ background: "var(--mk-brand)" }}
    >
      <TbRocket size="14px" />
    </div>
  );
};
