# @repo/tanstack-query

TanStack Query (React Query) helper package. Provides QueryClient setup, custom hooks, and utilities for data fetching.

## Setup

Wrap your app with the provider:

```tsx
import { TanStackQueryProvider } from "@repo/tanstack-query/provider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <TanStackQueryProvider>{children}</TanStackQueryProvider>
      </body>
    </html>
  );
}
```

## Usage

### Query Hooks

```tsx
import { useUsers, useUser } from "@repo/tanstack-query/hooks/use-users";
import { TanStackQueryProvider } from "@repo/tanstack-query/provider";

function UsersList() {
  const { data: users, isLoading } = useUsers();
  // ...
}

function UserDetail({ userId }) {
  const { data: user } = useUser(userId);
  // ...
}
```

### Mutation Hooks

```tsx
import {
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from "@repo/tanstack-query/hooks/use-users";

function CreateUserForm() {
  const createUser = useCreateUser();

  const handleSubmit = (data) => {
    createUser.mutate(data);
  };
  // ...
}
```

### Query Keys

```tsx
import { queryKeys } from "@repo/tanstack-query/hooks/query-keys";
```

## Features

- Pre-configured QueryClient with sensible defaults
- Type-safe query keys
- Custom hooks for common operations
- React Query DevTools in development
- Query invalidation helpers
