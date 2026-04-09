"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@buildbase/ui/components/ui/card";
import { Badge } from "@buildbase/ui/components/ui/badge";
import { User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@buildbase/ui/components/ui/avatar";
import { useSDKAuth } from "@/hooks/useSDKAuth";
import { WORKSPACE_ROLES } from "@buildbase/database/user";
import type { WorkspaceRole } from "@buildbase/database/user";

const ROLE_CONFIG: Record<WorkspaceRole, { label: string; variant: "default" | "secondary" | "outline" }> = {
  [WORKSPACE_ROLES.ADMIN]: { label: "Admin", variant: "default" },
  [WORKSPACE_ROLES.EDITOR]: { label: "Editor", variant: "secondary" },
  [WORKSPACE_ROLES.VIEWER]: { label: "Viewer", variant: "outline" },
};

const ProfilePage = () => {
  const { userName, userEmail, userImage, isAdmin, isEditor, isReady } = useSDKAuth();

  const roleKey: WorkspaceRole = isAdmin
    ? WORKSPACE_ROLES.ADMIN
    : isEditor
      ? WORKSPACE_ROLES.EDITOR
      : WORKSPACE_ROLES.VIEWER;
  const roleConfig = ROLE_CONFIG[roleKey];

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
            {isReady && (
              <div className="flex items-center gap-4 rounded-lg border p-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={userImage} alt={userName} />
                  <AvatarFallback>
                    {userName
                      ?.split(" ")
                      .map(n => n[0])
                      .join("") || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <p className="text-lg font-semibold">{userName || "User"}</p>
                  <p className="text-muted-foreground text-sm">{userEmail || ""}</p>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-muted-foreground text-xs">Workspace role</span>
                    <Badge variant={roleConfig.variant} className="text-xs">
                      {roleConfig.label}
                    </Badge>
                  </div>
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
