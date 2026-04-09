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
 *
 * The entire page is gated on PLAN_FEATURES.MEDIA_LIBRARY — workspaces without an
 * active subscription or without this feature on their plan see a locked state.
 */

import { ImageOff, Crown } from "lucide-react";
import { AssetsPage } from "@buildbase/components/media-library";
import { Button } from "@buildbase/ui/components/ui/button";
import { API } from "@/services";
import { useSDKAuth } from "@/hooks/useSDKAuth";
import { FeatureGate } from "@/components/feature-gate/FeatureGate";
import { PLAN_FEATURES } from "@buildbase/saas-sdk";

export default function Page() {
  const { isAdmin, isEditor, activeWorkspaceId, openSubscriptionSettings } = useSDKAuth();

  const canWrite = isAdmin || isEditor;

  return (
    <FeatureGate
      featureSlug={PLAN_FEATURES.MEDIA_LIBRARY}
      fallback={
        <div className="flex h-full flex-col items-center justify-center gap-6 py-24 text-center">
          <div className="bg-primary/10 rounded-full p-5">
            <Crown className="text-primary h-10 w-10" />
          </div>
          <div className="max-w-sm">
            <div className="mb-2 flex items-center justify-center gap-2">
              <ImageOff className="text-muted-foreground h-4 w-4" />
              <p className="font-semibold">Media Library not included</p>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your current plan doesn&apos;t include the Media Library. Upgrade your plan to upload and manage assets.
            </p>
          </div>
          <Button onClick={openSubscriptionSettings}>Upgrade Plan</Button>
        </div>
      }
      loadingFallback={
        <div className="flex h-full items-center justify-center py-24">
          <p className="text-muted-foreground text-sm">Loading…</p>
        </div>
      }
    >
      <AssetsPage
        api={API.mediaLibrary}
        workspaceId={activeWorkspaceId ?? undefined}
        permissions={{
          canWrite, // master switch — viewers get read-only UI
          canManageTags: isAdmin, // only admins can create/delete/rename tags
        }}
      />
    </FeatureGate>
  );
}
