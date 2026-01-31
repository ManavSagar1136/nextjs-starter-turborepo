"use client";

import React from "react";
import { LayoutDashboard } from "lucide-react";

const HomePage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Welcome to the admin dashboard</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
