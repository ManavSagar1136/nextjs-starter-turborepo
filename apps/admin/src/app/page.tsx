"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@buildbase/ui/components/ui/card";
import { Button } from "@buildbase/ui/components/ui/button";
import { Badge } from "@buildbase/ui/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@buildbase/ui/components/ui/avatar";
import { ThemeToggle } from "@buildbase/ui/components/ui/theme-toggle";
import { Building2, LogOut, User } from "lucide-react";
import { withClientAuth } from "@buildbase/helpers/hoc/withClientAuth";
import { useAuth } from "@buildbase/helpers/hooks/use-auth";
import { useSDKAuth } from "@/hooks/useSDKAuth";
import { APP_ROLES } from "@buildbase/database/user";
import { Routes } from "@/data/routes";

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
              Admin App - Buildbase SDK Demo
            </h1>
            <p className="text-muted-foreground">Admin panel with authentication and user management</p>
          </div>
          <div className="flex-shrink-0">
            <ThemeToggle />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Authentication
            </CardTitle>
            <CardDescription>Admin authentication and user information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Authentication Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Authentication</h4>

              {user ? (
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.image} alt={user.name} />
                      <AvatarFallback>
                        {user.name
                          ?.split(" ")
                          .map(n => n[0])
                          .join("") || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-muted-foreground text-sm">{user.email}</p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                  <Button onClick={signOut} variant="outline" size="sm">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Protect the page with authentication HOC
// Redirects to login if not authenticated
export default withClientAuth(HomePage, [APP_ROLES.ADMIN], {
  redirectTo: Routes.login,
});
