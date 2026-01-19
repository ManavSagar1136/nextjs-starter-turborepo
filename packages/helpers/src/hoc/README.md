# Authentication HOCs

Higher Order Components for protecting routes and components with authentication.

## withClientAuth

Client-side authentication HOC that redirects unauthenticated users to the login page.

### Usage

```tsx
import { withClientAuth } from "@buildbase/helpers/hoc/withClientAuth";
import { APP_ROLES } from "@buildbase/database";

// Protect component for any authenticated user
const ProtectedComponent = withClientAuth(MyComponent);

// Protect component for specific roles
const AdminComponent = withClientAuth(MyComponent, [APP_ROLES.ADMIN]);

// With custom redirect
const CustomComponent = withClientAuth(MyComponent, [], {
  redirectTo: "/custom-login",
});
```

### Props

- `WrappedComponent`: The component to protect
- `allowedRoles`: Array of allowed roles (empty = any authenticated user)
- `options`: Configuration options
  - `redirectTo`: Redirect path when not authenticated (default: "/login")
  - `loadingComponent`: Custom loading component

## withServerAuth

Server-side authentication HOC. Automatically reads and verifies JWT tokens from HTTP-only cookies.

Uses `getServerSession` which reads the `cms-auth-token` cookie and verifies it using JWT.

### Usage

```tsx
import { withServerAuth } from "@buildbase/helpers/hoc/withServerAuth";
import { Routes } from "@/data/routes";
import { APP_ROLES } from "@buildbase/database/user";

// Protect server component with authentication
export default withServerAuth(MyServerComponent, {
  redirectTo: Routes.login,
  allowedRoles: [APP_ROLES.ADMIN],
});
```

### Using getServerSession directly

You can also use `getServerSession` directly in server components for custom logic:

```tsx
import { getServerSession } from "@buildbase/helpers/auth";

export default async function MyServerComponent() {
  const session = await getServerSession();

  if (!session) {
    return <div>Not authenticated</div>;
  }

  return <div>Hello {session.user.email}</div>;
}
```

## Hooks

### useAuth

Basic authentication hook.

```tsx
import { useAuth } from "@buildbase/helpers/hooks/use-auth";

const { isAuthenticated, isLoading, user } = useAuth();
```

### useAuthRole

Authentication hook with role-based checks.

```tsx
import { useAuthRole } from "@buildbase/helpers/hooks/use-auth";
import { APP_ROLES } from "@buildbase/database";

const { isAuthenticated, isLoading } = useAuthRole([APP_ROLES.ADMIN]);
```
