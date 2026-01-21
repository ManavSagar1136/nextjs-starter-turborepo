import { NextRequest } from "next/server";

/**
 * Extracts organization/workspace ID from request
 * Checks in order: workspaceId cookie, x-workspace-id header, x-org-id header (for backward compatibility)
 *
 * @param req - The NextRequest object
 * @returns Workspace/Organization ID string or null if not found
 */
export function getOrgIdFromRequest(req: NextRequest): string | null {
  return (
    req.cookies.get("workspaceId")?.value || req.headers.get("x-workspace-id") || req.headers.get("x-org-id") || null
  );
}
