# @buildbase/saas-sdk

Reusable SaaS SDK provider component for React applications.

## Installation

```bash
# This package is already available in the monorepo
# For external repositories, you would install it via:
npm install @buildbase/saas-sdk
```

**Note:** This package depends on `@buildbase/sdk` which is installed automatically from npm (https://www.npmjs.com/package/@buildbase/sdk).

## Usage

### Basic Setup

The `SaaSProvider` automatically reads configuration from environment variables. You only need to provide callback functions:

```tsx
import { SaaSProvider } from "@buildbase/saas-sdk";
import { API } from "@/services";

// Wrap your app with SaaSProvider
export default function RootLayout({ children }) {
  const baseUrl = "http://localhost:3000";

  return (
    <SaaSProvider
      redirectUrl={`${baseUrl}/auth/callback`}
      onSignOut={async () => {
        try {
          await API.auth.logout();
        } catch (error) {
          console.error("Error during logout:", error);
        }
        window.location.reload();
      }}
      handleAuthentication={async (code: string) => {
        const data = await API.auth.verify(code);
        if (data.success && data.sessionId) {
          return { sessionId: data.sessionId };
        }
        throw new Error(data.message || "Authentication failed");
      }}
      handleEvent={(eventType: string, data: any) => {
        // Handle workspace events
        if (
          eventType === "workspace:changed" ||
          eventType === "workspace:created" ||
          eventType === "workspace:updated" ||
          eventType === "workspace:deleted" ||
          eventType === "workspace:user-added" ||
          eventType === "workspace:user-removed" ||
          eventType === "workspace:user-role-changed"
        ) {
          // Extract and prepare payload based on event type
          let payload: any = { eventType };

          // Handle different event data structures
          if (
            eventType === "workspace:user-added" ||
            eventType === "workspace:user-removed" ||
            eventType === "workspace:user-role-changed"
          ) {
            payload.userId = data.userId;
            payload.workspace = data.workspace;
            payload.role = data.role;
            if (eventType === "workspace:user-role-changed") {
              payload.previousRole = data.previousRole;
              payload.newRole = data.newRole;
            }
          } else if (eventType === "workspace:deleted") {
            payload.workspace = data.workspace || data;
          } else {
            payload.workspace = data.workspace;
            payload.previousWorkspace = data.previousWorkspace;
          }

          // Call your API to handle the event
          API.auth.handleWorkspaceEvent(payload).catch(error => {
            console.error(`Error handling ${eventType}:`, error);
          });
        }
      }}
    >
      {children}
    </SaaSProvider>
  );
}
```

## Configuration

The provider automatically reads configuration from environment variables:

- `NEXT_PUBLIC_SAAS_SERVER_URL` - SDK server URL (default: `http://localhost:3000`)
- `NEXT_PUBLIC_SAAS_ORG_ID` - Organization ID (default: `dev-org-id`)
- `NEXT_PUBLIC_SAAS_CLIENT_ID` - Client ID (default: `dev-client-id`)

The `redirectUrl` must be passed as a prop from your application.

## API

### `SaaSProvider`

Main provider component that wraps your application. It automatically reads configuration from environment variables and passes your callbacks to the underlying `SaaSOSProvider`.

#### Props

- `children: React.ReactNode` - Your app content
- `redirectUrl: string` - Redirect URL for authentication callback (required)
- `onSignOut?: () => void | Promise<void>` - Called when user signs out
- `handleAuthentication?: (code: string) => Promise<{ sessionId: string }>` - Handles authentication code from SDK
- `handleEvent?: (eventType: string, data: any) => void | Promise<void>` - Handles SDK events

### Available Events

The `handleEvent` callback receives various event types:

- `user:created` - User account created
- `user:updated` - User profile updated
- `workspace:created` - New workspace created
- `workspace:changed` - Workspace switched
- `workspace:updated` - Workspace updated
- `workspace:deleted` - Workspace deleted
- `workspace:user-added` - User added to workspace
- `workspace:user-removed` - User removed from workspace
- `workspace:user-role-changed` - User role changed in workspace

## SDK Token Verification

The package also provides a utility function for verifying authentication codes with the Buildbase SDK:

```typescript
import { verifySDKToken } from "@buildbase/saas-sdk/token-verification";

const result = await verifySDKToken({
  code: "auth-code-from-sdk",
  baseUrl: "https://your-sdk-server.com", // Optional, defaults to env var
  clientId: "your-client-id", // Optional, defaults to env var
  clientSecret: "your-client-secret", // Optional, defaults to env var
  orgId: "your-org-id", // Optional, defaults to env var
});

if (result.success) {
  console.log("Session ID:", result.sessionId);
  console.log("User:", result.user);
  console.log("Workspaces:", result.workspaces);
}
```

### Token Verification API

#### `verifySDKToken(config: SDKTokenVerificationConfig): Promise<SDKTokenVerificationResponse>`

Verifies an authentication code with the Buildbase SDK backend.

**Parameters:**

- `config.code` (required): Authentication code from SDK
- `config.baseUrl` (optional): SDK server URL (defaults to `NEXT_PUBLIC_SAAS_SERVER_URL`)
- `config.clientId` (optional): Client ID (defaults to `NEXT_PUBLIC_SAAS_CLIENT_ID`)
- `config.clientSecret` (optional): Client secret (defaults to `SAAS_CLIENT_SECRET` or `NEXT_PUBLIC_SAAS_CLIENT_SECRET`)
- `config.orgId` (optional): Organization ID (defaults to `NEXT_PUBLIC_SAAS_ORG_ID`)

**Returns:**

- `success: boolean` - Whether verification was successful
- `sessionId?: string` - Session ID from SDK
- `user?: object` - User data from SDK
- `workspaces?: array` - Workspaces array from SDK
- `message?: string` - Error message if verification failed
