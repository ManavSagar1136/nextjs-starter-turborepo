"use client";

/**
 * Hook to initialize workspaceId in Redux from session
 *
 * This hook fetches the current session on mount and updates Redux
 * with workspaceId if it's missing. This ensures workspaceId is available
 * even after page refresh.
 */

import { useEffect } from "react";
import { useUser, useAppDispatch } from "@/store/hooks";
import { updateUser } from "@/store";
import { API } from "@/services";

export function useInitWorkspace() {
  const user = useUser();
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Fetch session if workspaceId or workspaceRole is missing so the store stays in sync after page refresh
    if (user.id && (!user.workspaceId || !user.workspaceRole)) {
      API.auth
        .getSession()
        .then(session => {
          if (session.authenticated && session.user) {
            dispatch(
              updateUser({
                workspaceId: session.user.workspaceId || null,
                workspaceName: session.user.workspaceName || null,
                workspaceRole: session.user.workspaceRole || null,
              })
            );
          }
        })
        .catch(error => {
          console.error("Failed to initialize workspace:", error);
        });
    }
  }, [user.id, user.workspaceId, user.workspaceRole, dispatch]);
}
