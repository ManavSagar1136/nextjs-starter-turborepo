"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@buildbase/ui/components/ui/card";
import { User } from "lucide-react";
import { useAuth } from "@buildbase/helpers/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@buildbase/ui/components/ui/avatar";

const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Settings
            </CardTitle>
            <CardDescription>Manage your account settings and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {user && (
              <div className="flex items-center gap-4 rounded-lg border p-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.image} alt={user.name} />
                  <AvatarFallback>
                    {user.name
                      ?.split(" ")
                      .map(n => n[0])
                      .join("") || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold">{user.name || "User"}</p>
                  <p className="text-muted-foreground text-sm">{user.email || ""}</p>
                  {user.role && <p className="text-muted-foreground mt-1 text-xs">Role: {user.role}</p>}
                </div>
              </div>
            )}
            <p className="text-muted-foreground">Profile settings page coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
