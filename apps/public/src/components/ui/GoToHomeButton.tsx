"use client";

import Link from "next/link";
import { Button } from "@buildbase/ui/button";
import { Routes } from "@/data/routes";

export const GoToHomeButton = () => {
  return (
    <Link href={Routes.root}>
      <Button>Go to Home</Button>
    </Link>
  );
};
