"use client";

import React from "react";
import { Building2 } from "lucide-react";

const WorkspacesPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Building2 className="h-5 w-5" />
            Workspaces Management
          </h1>
          <p className="text-muted-foreground mt-1">Manage workspaces and their settings</p>
        </div>
        <p className="text-muted-foreground">Workspaces management page coming soon...</p>
      </div>
    </div>
  );
};

export default WorkspacesPage;
