import { ReactElement } from "react";
import { TbCheck } from "react-icons/tb";

interface FeatureLineProps {
  children: string | ReactElement;
}

export const FeatureLine = ({ children }: FeatureLineProps) => {
  return (
    <div className="flex items-center">
      <TbCheck className="text-brand-400 mr-2" />
      <p className="text-sm text-gray-700 dark:text-white/90">{children}</p>
    </div>
  );
};

export default FeatureLine;
