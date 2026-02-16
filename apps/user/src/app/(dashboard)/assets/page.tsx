"use client";

/**
 * Assets Page
 *
 * This page uses the shared AssetsPage component from @buildbase/components/media-library.
 * All page logic is handled by the shared component - we just need to pass the API.
 */

import { AssetsPage } from "@buildbase/components/media-library";
import { API } from "@/services";
import { useWorkspaceId } from "@/store/hooks";

export default function Page() {
  const workspaceId = useWorkspaceId();
  return <AssetsPage api={API.mediaLibrary} workspaceId={workspaceId} />;
}
