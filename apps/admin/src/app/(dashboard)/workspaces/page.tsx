"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@buildbase/ui/components/ui/card";
import { Building2 } from "lucide-react";

const WorkspacesPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Workspaces Management
            </CardTitle>
            <CardDescription>Manage workspaces and their settings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Workspaces management page coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkspacesPage;
