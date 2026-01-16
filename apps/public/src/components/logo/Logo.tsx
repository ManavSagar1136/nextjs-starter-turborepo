import { TbRocket } from "react-icons/tb";

export const Logo = () => {
  return (
    <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-brand-200">
      <TbRocket size="24px" />
      {/* <img
      src={SiteConfig.logo}
      style={{
        height: "60px",
      }}
      alt={SiteConfig.name}
    /> */}
    </div>
  );
};

export const LogoSmall = () => {
  return (
    <div className="w-4.5 h-4.5 bg-brand-500 rounded flex items-center justify-center text-brand-200">
      <TbRocket size="14px" />
      {/* <img
      src={SiteConfig.logo}
      style={{
        height: "60px",
      }}
      alt={SiteConfig.name}
    /> */}
    </div>
  );
};
