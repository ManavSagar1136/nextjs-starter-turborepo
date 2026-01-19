import React from "react";
import { Routes } from "@/data/routes";
import { MoveLeftIcon } from "lucide-react";

import CustomButton from "../ui/custom-button";

const GoToDocsButton = () => {
  return (
    <CustomButton
      link={true}
      href={Routes.docs}
      classNames="px-6 flex justify-center items-center gap-2"
    >
      <MoveLeftIcon />
      {"Go To Docs"}
    </CustomButton>
  );
};

export default GoToDocsButton;
