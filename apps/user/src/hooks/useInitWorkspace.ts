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
    // Only fetch if user is authenticated but workspaceId is missing
    if (user.id && !user.workspaceId) {
      API.auth
        .getSession()
        .then(session => {
          if (session.authenticated && session.user?.workspaceId) {
            dispatch(
              updateUser({
                workspaceId: session.user.workspaceId,
                workspaceName: session.user.workspaceName || null,
              })
            );
          }
        })
        .catch(error => {
          console.error("Failed to initialize workspace:", error);
        });
    }
  }, [user.id, user.workspaceId, dispatch]);
}
