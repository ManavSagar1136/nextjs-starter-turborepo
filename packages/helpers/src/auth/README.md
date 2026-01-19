# API Authentication Middleware

Middleware functions for protecting API routes with authentication, role checks, and permission checks.

## Available Functions

### `withAuth`

Main authentication wrapper with optional role-based access control. This is the primary function to use.

**IMPORTANT**: This function checks **APP_ROLES only** (system-level roles: admin, user).
For workspace-level permissions, use `withPermissionCheck` instead.

Roles are read from the JWT token (which contains the app role from Buildbase SaaS SDK).

```typescript
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";

const handlePOST = async (req: NextRequest) => {
  const user = (req as any).authenticatedUser;
  return NextResponse.json({ success: true, user });
};

// Authentication only (no role check)
export const POST = withAuth(handlePOST);

// Authentication with APP_ROLE check
export const POST = withAuth(handlePOST, [APP_ROLES.ADMIN]);

// Multiple APP_ROLES allowed
export const POST = withAuth(handlePOST, [APP_ROLES.ADMIN, APP_ROLES.USER]);

// With options (disable internal API key bypass)
export const POST = withAuth(handlePOST, [APP_ROLES.ADMIN], {
  allowInternalApiKey: false,
});
```

### `withRoleCheck`

Convenience wrapper around `withAuth` that requires roles to be specified. Use this when you want to make it explicit that roles are required.

**IMPORTANT**: This function checks **APP_ROLES only** (system-level roles: admin, user).
For workspace-level permissions, use `withPermissionCheck` instead.

**Note**: This is a thin wrapper around `withAuth`. For more flexibility, use `withAuth` directly.

```typescript
import { withRoleCheck } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";

const handlePOST = async (req: NextRequest) => {
  const user = (req as any).authenticatedUser;
  return NextResponse.json({ success: true, user });
};

// APP_ROLES check (roles are required)
export const POST = withRoleCheck(handlePOST, [APP_ROLES.ADMIN]);

// Multiple APP_ROLES
export const POST = withRoleCheck(handlePOST, [
  APP_ROLES.ADMIN,
  APP_ROLES.USER,
]);

// With options
export const POST = withRoleCheck(handlePOST, [APP_ROLES.ADMIN], {
  allowInternalApiKey: false,
});
```

### `withPermissionCheck`

Workspace role-based access control. Checks if user has one of the allowed workspace roles.

**IMPORTANT**: This function queries the database to get the user's workspace role from the `WorkspaceMember` table. The workspace ID is read from the JWT token (`user.workspaceId`).

After authentication, it:

1. Gets the workspace ID from the token
2. Queries the database to find the user's workspace membership
3. Checks if the user's workspace role is in the allowed list

```typescript
import { withPermissionCheck } from "@buildbase/helpers/auth";
import { WORKSPACE_ROLES } from "@buildbase/database/user";

const handlePOST = async (req: NextRequest) => {
  const user = (req as any).authenticatedUser;
  const workspaceRole = (req as any).workspaceRole; // Role from database
  return NextResponse.json({ success: true, user, workspaceRole });
};

// Only allow workspace admins and editors
export const POST = withPermissionCheck(handlePOST, [
  WORKSPACE_ROLES.ADMIN,
  WORKSPACE_ROLES.EDITOR,
]);

// Only allow workspace admins
export const POST = withPermissionCheck(handlePOST, [WORKSPACE_ROLES.ADMIN]);

// Allow all workspace roles
export const POST = withPermissionCheck(handlePOST, [
  WORKSPACE_ROLES.ADMIN,
  WORKSPACE_ROLES.EDITOR,
  WORKSPACE_ROLES.VIEWER,
]);

// Workspace admins bypass role checks by default (can be disabled)
export const POST = withPermissionCheck(handlePOST, [WORKSPACE_ROLES.EDITOR], {
  allowWorkspaceAdmin: true, // default - workspace admins bypass checks
});
```

## Role Constants

Import role constants from `@buildbase/database/user`:

```typescript
import { APP_ROLES, WORKSPACE_ROLES } from "@buildbase/database/user";

// APP_ROLES: System-level roles (use with withAuth/withRoleCheck)
APP_ROLES.ADMIN; // "admin" - system administrator
APP_ROLES.USER; // "user" - regular system user

// WORKSPACE_ROLES: Workspace-level roles (use with withPermissionCheck)
WORKSPACE_ROLES.ADMIN; // "admin" - workspace administrator (bypasses permission checks)
WORKSPACE_ROLES.EDITOR; // "editor" - can edit workspace content
WORKSPACE_ROLES.VIEWER; // "viewer" - read-only access to workspace
```

## When to Use Which Function

- **`withAuth` / `withRoleCheck`**: Use for system-level access control (APP_ROLES)
  - Example: "Only system admins can access this endpoint"
  - Checks the user's system role from JWT token (admin or user)
  - No database query needed

- **`withPermissionCheck`**: Use for workspace-level access control (WORKSPACE_ROLES)
  - Example: "Only workspace admins and editors can access this endpoint"
  - Queries the database to get the user's role in the workspace (from WorkspaceMember table)
  - Requires workspaceId in the JWT token
  - Workspace admins automatically bypass role checks (by default)

## Accessing Authenticated User

All middleware functions attach the authenticated user to the request:

```typescript
const handlePOST = async (req: NextRequest) => {
  const user = (req as any).authenticatedUser;

  // User properties available:
  // - user.userId (database user ID)
  // - user.sdkUserId (SDK user ID from Buildbase)
  // - user.email
  // - user.role (APP_ROLE from Buildbase SDK: admin or user)
  // - user.workspaceId (workspace ID from token)
  // - user.workspaceName

  return NextResponse.json({ user });
};
```

### Accessing Workspace Role (withPermissionCheck only)

When using `withPermissionCheck`, the workspace role from the database is also attached:

```typescript
const handlePOST = async (req: NextRequest) => {
  const user = (req as any).authenticatedUser;
  const workspaceRole = (req as any).workspaceRole; // From WorkspaceMember table

  // workspaceRole will be one of: WORKSPACE_ROLES.ADMIN, WORKSPACE_ROLES.EDITOR, WORKSPACE_ROLES.VIEWER

  return NextResponse.json({ user, workspaceRole });
};
```

## Internal API Key

All middleware functions support internal API key authentication (via `Authorization: Bearer <API_SECRET>` header) which bypasses user authentication and role/permission checks.

## Error Responses

- **401 Unauthorized**: No authentication token found or token invalid
- **403 Forbidden**: User doesn't have required role/permissions
- **400 Bad Request**: Invalid request (e.g., no permissions specified)
