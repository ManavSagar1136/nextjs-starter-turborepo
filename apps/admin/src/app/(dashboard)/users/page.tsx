"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@buildbase/ui/components/ui/card";
import { Users } from "lucide-react";

const UsersPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users Management
            </CardTitle>
            <CardDescription>Manage users and their permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Users management page coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UsersPage;
