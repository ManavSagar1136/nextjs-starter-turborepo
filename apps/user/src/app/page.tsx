"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@buildbase/ui/components/ui/card";
import { Button } from "@buildbase/ui/components/ui/button";
import { Badge } from "@buildbase/ui/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@buildbase/ui/components/ui/avatar";
import { ThemeToggle } from "@buildbase/ui/components/ui/theme-toggle";
import { WorkspaceSwitcher } from "@buildbase/saas-sdk";
import { Building2, LogOut, User, ChevronDown } from "lucide-react";
import { withClientAuth } from "@buildbase/helpers/hoc/withClientAuth";
import { useAuth } from "@buildbase/helpers/hooks/use-auth";
import { useSDKAuth } from "@/hooks/useSDKAuth";
import { Routes } from "@/data/routes";
import { APP_ROLES } from "@buildbase/database/user";

const HomePage = () => {
  const { user } = useAuth();
  const { signOut } = useSDKAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex-1 text-center">
            <h1 className="mb-4 flex items-center justify-center gap-3 text-3xl font-bold">
              <Building2 className="h-8 w-8 text-blue-600" />
              User App - Buildbase SDK Demo
            </h1>
            <p className="text-muted-foreground">Simple demonstration of workspace switching and authentication</p>
          </div>
          <div className="flex-shrink-0">
            <ThemeToggle />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Workspace & Authentication
            </CardTitle>
            <CardDescription>Test workspace switching and authentication features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Authentication Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Authentication</h4>

              {user?.id ? (
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.image || undefined} alt={user?.name || undefined} />
                      <AvatarFallback>
                        {user?.name
                          ?.split(" ")
                          .map(n => n[0])
                          .join("") || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name || "User"}</p>
                      <p className="text-muted-foreground text-sm">{user.email || ""}</p>
                      {user.role && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {user.role}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button onClick={signOut} variant="outline" size="sm">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              ) : null}
            </div>

            {/* Workspace Switcher Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Workspace Switcher</h4>

              <WorkspaceSwitcher
                onWorkspaceChange={_ => {
                  return Promise.resolve();
                }}
                trigger={(isLoading, currentWorkspace) => {
                  if (isLoading || !currentWorkspace) {
                    return (
                      <div className="hover:bg-muted flex min-w-40 cursor-pointer items-center gap-2 rounded-md border p-3 transition-colors">
                        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gray-200">
                          <Building2 className="h-4 w-4 text-gray-500" />
                        </div>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="font-medium">Choose a workspace</span>
                          <span className="text-muted-foreground text-xs">Select your workspace</span>
                        </div>
                        <ChevronDown className="text-muted-foreground h-4 w-4" />
                      </div>
                    );
                  }

                  return (
                    <div className="hover:bg-muted flex min-w-40 cursor-pointer items-center gap-2 rounded-md border p-3 transition-colors">
                      <div className="bg-muted flex h-full max-h-8 w-full max-w-8 items-center justify-center rounded-lg">
                        {currentWorkspace.image ? (
                          <img
                            src={currentWorkspace.image}
                            alt={currentWorkspace.name || ""}
                            className="h-8 w-8 rounded-lg object-cover"
                          />
                        ) : (
                          <Building2 className="text-muted-foreground h-4 w-4" />
                        )}
                      </div>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="font-medium">{currentWorkspace.name || "Workspace"}</span>
                        <span className="text-muted-foreground text-xs">
                          {currentWorkspace.users?.length || 0} members
                        </span>
                      </div>
                      <ChevronDown className="text-muted-foreground h-4 w-4" />
                    </div>
                  );
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Protect the page with authentication HOC
// Redirects to login if not authenticated
export default withClientAuth(HomePage, [APP_ROLES.USER], {
  redirectTo: Routes.login,
});
