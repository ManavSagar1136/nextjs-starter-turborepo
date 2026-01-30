"use client";

import React from "react";
import { Users } from "lucide-react";

const UsersPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Users className="h-5 w-5" />
            Users Management
          </h1>
          <p className="text-muted-foreground mt-1">Manage users and their permissions</p>
        </div>
        <p className="text-muted-foreground">Users management page coming soon...</p>
      </div>
    </div>
  );
};

export default UsersPage;
