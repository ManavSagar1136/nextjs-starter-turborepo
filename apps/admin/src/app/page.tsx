"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@buildbase/ui/components/ui/card";
import { Button } from "@buildbase/ui/components/ui/button";
import { Badge } from "@buildbase/ui/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@buildbase/ui/components/ui/avatar";
import { Building2, LogIn, LogOut, User } from "lucide-react";
import { useSDKAuth } from "@/hooks/useSDKAuth";

export default function Home() {
  const { user, isAuthenticated, isLoading, signIn, signOut } = useSDKAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="mb-4 flex items-center justify-center gap-3 text-3xl font-bold">
            <Building2 className="h-8 w-8 text-blue-600" />
            Admin App - Buildbase SDK Demo
          </h1>
          <p className="text-muted-foreground">Admin panel with authentication and user management</p>
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

              {isLoading ? (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <div className="border-primary h-4 w-4 animate-spin rounded-full border-b-2"></div>
                  Loading...
                </div>
              ) : isAuthenticated && user ? (
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
              ) : (
                <div className="flex items-center justify-center rounded-lg border p-4">
                  <Button onClick={signIn} className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Button>
                </div>
              )}
            </div>

            {/* Status Information */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Authentication Status:</span>
                <Badge variant={isAuthenticated ? "default" : "secondary"}>
                  {isAuthenticated ? "Authenticated" : "Not Authenticated"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
