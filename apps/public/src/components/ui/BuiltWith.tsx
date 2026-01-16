import Link from "next/link";

import { LogoSmall } from "@/components/logo/Logo";

import { SiteConfig } from "@/config";

const BuiltWith = () => {
  return (
    <Link
      href={SiteConfig.madeBy.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center border px-2 py-1 my-1 rounded-lg text-xs transition-all border-brand-200 hover:text-brand-700 hover:bg-brand-50 hover:border-brand-200"
    >
      <span>Built with</span>
      <div className="flex items-center ml-1">
        <LogoSmall />
        <span className="font-bold text-brand-500 dark:text-brand-100 ml-1">
          {SiteConfig.madeBy.name}
        </span>
      </div>
    </Link>
  );
};

export default BuiltWith;
