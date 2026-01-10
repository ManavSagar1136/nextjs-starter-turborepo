"use client";

import { SaaSProvider as BaseSaaSProvider } from "@buildbase/saas-sdk";
import React from "react";
import { API } from "@/services";
import { env } from "@buildbase/env";
import { useAppDispatch } from "@/store/hooks";
import { setUser, clearUser } from "@/store";

interface SaaSProviderProps {
  children: React.ReactNode;
}

export default function SaaSProvider({ children }: SaaSProviderProps) {
  const dispatch = useAppDispatch();

  // Get base URL from environment variable
  // Use NEXT_PUBLIC_* variable for client components
  const baseUrl = env.NEXT_PUBLIC_USER_APP_URL;
  const redirectUrl = `${baseUrl}`;

  return (
    <BaseSaaSProvider
      redirectUrl={redirectUrl}
      onSignOut={async () => {
        // Clear user state from Redux slice
        dispatch(clearUser());

        // Clear auth cookie by calling logout endpoint
        try {
          await API.auth.logout();
        } catch (error) {
          console.error("Error during logout:", error);
        }
        window.location.reload();
      }}
      handleAuthentication={async (code: string) => {
        try {
          const data = await API.auth.verify(code);
          console.log("Authentication data:", data);
          if (data.success && data.sessionId && data.user) {
            // Store complete user info in Redux slice
            // All UserState fields must be set to ensure consistency
            const userId = data.user.id || data.user._id || null;
            dispatch(
              setUser({
                id: userId,
                email: data.user.email || null,
                name: data.user.name || null,
                image: data.user.image || null,
                role: data.user.role || null,
                sdkUserId: userId, // SDK user ID stored for API calls and consistency
              })
            );

            // Token is stored in HTTP-only cookie automatically
            return { sessionId: data.sessionId };
          } else {
            throw new Error(data.message || "Authentication failed");
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Authentication failed";
          throw new Error(errorMessage);
        }
      }}
      handleEvent={(eventType: string, data: any) => {
        console.log("*** eventType", eventType);
        console.log("*** data", data);

        // Handle workspace changed, created, updated, deleted, user-added, user-removed, and user-role-changed events
        if (
          eventType === "workspace:changed" ||
          eventType === "workspace:created" ||
          eventType === "workspace:updated" ||
          eventType === "workspace:deleted" ||
          eventType === "workspace:user-added" ||
          eventType === "workspace:user-removed" ||
          eventType === "workspace:user-role-changed"
        ) {
          // For workspace:deleted, the data structure can vary
          // Sometimes it's the workspace object directly, sometimes nested
          // For other events, it's wrapped in a workspace property
          let workspace: any;
          let previousWorkspace: any;
          let userId: string | undefined;
          let role: string | undefined;
          let previousRole: string | undefined;
          let newRole: string | undefined;

          if (
            eventType === "workspace:user-added" ||
            eventType === "workspace:user-removed" ||
            eventType === "workspace:user-role-changed"
          ) {
            // For user-added/user-removed/user-role-changed events, extract userId, workspace, and role
            const userEventData = data as any;
            userId = userEventData.userId;
            workspace = userEventData.workspace;
            role = userEventData.role;
            previousRole = userEventData.previousRole;
            newRole = userEventData.newRole;
          } else if (eventType === "workspace:deleted") {
            // For deleted events, data might be the workspace directly or nested
            const deletedData = data as any;
            if (deletedData.workspace) {
              // If nested, extract it (could be workspace.workspace or just workspace)
              workspace = deletedData.workspace.workspace || deletedData.workspace;
            } else {
              // Otherwise, data is the workspace itself
              workspace = deletedData;
            }
          } else {
            const eventData = data as {
              workspace?: any;
              previousWorkspace?: any;
            };
            workspace = eventData?.workspace;
            previousWorkspace = eventData?.previousWorkspace;
          }

          if (
            workspace ||
            eventType === "workspace:user-added" ||
            eventType === "workspace:user-removed" ||
            eventType === "workspace:user-role-changed"
          ) {
            // Prepare payload - include userId and role for user-related events
            const payload: any = {
              eventType,
              workspace,
              previousWorkspace,
            };

            // Add userId and role for user-added/user-removed events
            if (eventType === "workspace:user-added" || eventType === "workspace:user-removed") {
              payload.userId = userId;
              payload.role = role;
            }

            // Add userId, previousRole, and newRole for user-role-changed events
            if (eventType === "workspace:user-role-changed") {
              payload.userId = userId;
              payload.previousRole = previousRole;
              payload.newRole = newRole;
            }

            console.log(`[SaaSProvider] Sending ${eventType} event:`, payload);

            // Call backend API to handle workspace event using API service
            // Cookies are automatically sent by the browser via axios
            API.auth
              .handleWorkspaceEvent(payload)
              .then(result => {
                if (result.success) {
                  // Token is managed via HTTP-only cookies, no need to store in localStorage
                  const actionMap: Record<string, string> = {
                    "workspace:created": "created",
                    "workspace:changed": "changed",
                    "workspace:updated": "updated",
                    "workspace:deleted": "deleted",
                    "workspace:user-added": "user added to",
                    "workspace:user-removed": "user removed from",
                    "workspace:user-role-changed": "user role changed in",
                  };
                  console.log(`Workspace ${actionMap[eventType] || "processed"} successfully:`, result);
                } else {
                  const actionMap: Record<string, string> = {
                    "workspace:created": "create",
                    "workspace:changed": "update",
                    "workspace:updated": "update",
                    "workspace:deleted": "delete",
                    "workspace:user-added": "add user to",
                    "workspace:user-removed": "remove user from",
                    "workspace:user-role-changed": "change user role in",
                  };
                  console.error(`Failed to ${actionMap[eventType] || "process"} workspace:`, result);
                }
              })
              .catch(error => {
                const actionMap: Record<string, string> = {
                  "workspace:created": "creating",
                  "workspace:changed": "updating",
                  "workspace:updated": "updating",
                  "workspace:deleted": "deleting",
                  "workspace:user-added": "adding user to",
                  "workspace:user-removed": "removing user from",
                  "workspace:user-role-changed": "changing user role in",
                };
                console.error(`Error ${actionMap[eventType] || "processing"} workspace:`, error);
              });
          }
        }
      }}
    >
      {children}
    </BaseSaaSProvider>
  );
}
