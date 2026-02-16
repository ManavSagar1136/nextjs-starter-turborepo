"use client";

/**
 * WorkspaceInitializer Component
 *
 * Initializes workspaceId in Redux from session on mount.
 * This ensures workspaceId is available even after page refresh.
 */

import { useInitWorkspace } from "@/hooks/useInitWorkspace";

export function WorkspaceInitializer() {
  useInitWorkspace();
  return null; // This component doesn't render anything
}
