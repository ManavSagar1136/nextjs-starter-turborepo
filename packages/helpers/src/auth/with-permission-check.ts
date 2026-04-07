import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "./auth-middleware";
import { WORKSPACE_ROLES, type WorkspaceRole } from "@buildbase/database/user";
import { prisma } from "@buildbase/database";

/**
 * Options for withPermissionCheck middleware
 */
export interface PermissionCheckOptions {
  /**
   * Whether to allow internal API key to bypass role checks
   * @default true
   */
  allowInternalApiKey?: boolean;
  /**
   * Whether to allow workspace admins to bypass role checks
   * @default true
   */
  allowWorkspaceAdmin?: boolean;
}

/**
 * Higher-order function to wrap API route handlers with workspace role-based access control
 *
 * Checks if the authenticated user has one of the allowed workspace roles.
 * After authentication, queries the database to get the user's role in the workspace
 * (from WorkspaceMember table) and verifies it against the allowed roles list.
 *
 * The workspace ID is read from the JWT token (user.workspaceId).
 *
 * @param handler - The API route handler function
 * @param allowedWorkspaceRoles - Array of allowed workspace roles (WORKSPACE_ROLES)
 * @param options - Optional configuration
 * @returns Wrapped handler with workspace role-based access control
 *
 * @example
 * ```typescript
 * import { withPermissionCheck } from "@buildbase/helpers/auth";
 * import { WORKSPACE_ROLES } from "@buildbase/database/user";
 *
 * const handlePOST = async (req: NextRequest) => {
 *   const user = (req as any).authenticatedUser;
 *   const workspaceRole = (req as any).workspaceRole;
 *   return NextResponse.json({ success: true, user, workspaceRole });
 * };
 *
 * // Only allow workspace admins and editors
 * export const POST = withPermissionCheck(
 *   handlePOST,
 *   [WORKSPACE_ROLES.ADMIN, WORKSPACE_ROLES.EDITOR]
 * );
 *
 * // Only allow workspace admins
 * export const POST = withPermissionCheck(
 *   handlePOST,
 *   [WORKSPACE_ROLES.ADMIN]
 * );
 *
 * // Allow all workspace roles
 * export const POST = withPermissionCheck(
 *   handlePOST,
 *   [WORKSPACE_ROLES.ADMIN, WORKSPACE_ROLES.EDITOR, WORKSPACE_ROLES.VIEWER]
 * );
 * ```
 */
export function withPermissionCheck<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  allowedWorkspaceRoles: WorkspaceRole[],
  options: PermissionCheckOptions = {}
): (request: NextRequest, ...args: T) => Promise<NextResponse> {
  const { allowInternalApiKey = true, allowWorkspaceAdmin = true } = options;

  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    if (!allowedWorkspaceRoles || allowedWorkspaceRoles.length === 0) {
      return NextResponse.json({ error: "Bad Request", message: "No workspace roles specified" }, { status: 400 });
    }

    // Authenticate the request
    const authResult = authenticateRequest(request);

    if (!authResult.success || !authResult.user) {
      return authResult.response || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = authResult.user;

    // Allow internal API key to bypass role checks if configured
    if (allowInternalApiKey && authResult.isInternalApiKey) {
      (request as any).authenticatedUser = user;
      return handler(request, ...args);
    }

    // Check if workspaceId is present in token
    if (!user.workspaceId) {
      return NextResponse.json({ error: "Bad Request", message: "Workspace ID not found in token" }, { status: 400 });
    }

    // Check if userId is present in token
    if (!user.userId) {
      return NextResponse.json({ error: "Bad Request", message: "User ID not found in token" }, { status: 400 });
    }

    try {
      // Find workspace by SDK ID first (workspaceId in token is likely SDK ID)
      let workspace = await prisma.workspace.findUnique({
        where: { sdkWorkspaceId: user.workspaceId },
      });

      // If not found by SDK ID, try as database ID
      if (!workspace) {
        workspace = await prisma.workspace.findUnique({
          where: { id: user.workspaceId },
        });
      }

      if (!workspace) {
        return NextResponse.json({ error: "Not Found", message: "Workspace not found" }, { status: 404 });
      }

      // Query membership using database IDs
      // IMPORTANT: We always use the database as the source of truth for workspace roles.
      // We do NOT use user.role (APP_ROLE) or the JWT's root-level role field.
      // The database WorkspaceMember table is the authoritative source.
      const membership = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: user.userId,
            workspaceId: workspace.id,
          },
        },
      });

      if (!membership || !membership.isActive) {
        return NextResponse.json(
          { error: "Forbidden", message: "User is not a member of this workspace" },
          { status: 403 }
        );
      }

      // Use membership.role from database (NOT user.role which is APP_ROLE)
      const workspaceRole = membership.role as WorkspaceRole;

      // Check if workspace admin should bypass (if enabled and user is admin)
      if (allowWorkspaceAdmin && workspaceRole === WORKSPACE_ROLES.ADMIN) {
        (request as any).authenticatedUser = user;
        (request as any).workspaceRole = membership.role;
        (request as any).dbWorkspaceId = workspace.id;
        return handler(request, ...args);
      }

      // Check if user's workspace role is in allowed list
      // Using workspaceRole from database (NOT user.role)
      if (!allowedWorkspaceRoles.includes(workspaceRole)) {
        console.error(`User workspace role ${workspaceRole} not in allowed roles: ${allowedWorkspaceRoles.join(", ")}`);
        return NextResponse.json(
          {
            error: "Forbidden",
            message: `Insufficient permissions. Required workspace roles: ${allowedWorkspaceRoles.join(", ")}. User has: ${workspaceRole}`,
          },
          { status: 403 }
        );
      }

      // Attach authenticated user, workspace role, and DB workspace ID to request.
      // dbWorkspaceId is the MongoDB ObjectId — use this (not user.workspaceId which is the SDK UUID)
      // for any database queries that reference workspace foreign keys.
      (request as any).authenticatedUser = user;
      (request as any).workspaceRole = workspaceRole;
      (request as any).dbWorkspaceId = workspace.id;

      return handler(request, ...args);
    } catch (error) {
      console.error("Error checking workspace role:", error);
      return NextResponse.json(
        { error: "Internal Server Error", message: "Failed to verify workspace role" },
        { status: 500 }
      );
    }
  };
}
