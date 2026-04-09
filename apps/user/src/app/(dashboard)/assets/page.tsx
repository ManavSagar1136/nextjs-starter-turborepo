"use client";

/**
 * Assets Page
 *
 * Passes role-based permissions to AssetsPage so the media library UI
 * adapts to the user's workspace role:
 *   - ADMIN / EDITOR → full write access (upload, create/delete folder, delete assets…)
 *   - VIEWER         → read-only (no upload, no delete, no folder/tag management)
 *
 * Server-side authorization is enforced independently by withPermissionCheck in each
 * API route, so a viewer cannot bypass this by calling the API directly.
 */

import { AssetsPage } from "@buildbase/components/media-library";
import { API } from "@/services";
import { useWorkspaceId } from "@/store/hooks";
import { useSDKAuth } from "@/hooks/useSDKAuth";

export default function Page() {
  const workspaceId = useWorkspaceId();
  const { isAdmin, isEditor } = useSDKAuth();

  const canWrite = isAdmin || isEditor;

  return (
    <AssetsPage
      api={API.mediaLibrary}
      workspaceId={workspaceId}
      permissions={{
        canWrite, // master switch — viewers get read-only UI
        canManageTags: isAdmin, // only admins can create/delete/rename tags
      }}
    />
  );
}
