# @buildbase/tanstack-query

TanStack Query (React Query) helper package. Provides QueryClient setup, custom hooks, and utilities for data fetching.

**All TanStack Query hooks, types, and utilities are re-exported from this package**, so apps don't need to install `@tanstack/react-query` directly.

## Setup

Wrap your app with the provider:

```tsx
import { TanStackQueryProvider } from "@buildbase/tanstack-query/provider";

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

## Importing from Package

Instead of importing from `@tanstack/react-query`, import from `@buildbase/tanstack-query`:

```tsx
// ✅ Good - Import from package
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
} from "@buildbase/tanstack-query";

// ❌ Bad - Don't import directly
import { useQuery } from "@tanstack/react-query";
```

## Available Exports

### Hooks

- `useQuery` - Basic query hook
- `useMutation` - Mutation hook
- `useQueryClient` - Access QueryClient instance
- `useInfiniteQuery` - Infinite query hook
- `useSuspenseQuery` - Suspense query hook
- `useSuspenseInfiniteQuery` - Suspense infinite query hook
- `useQueries` - Multiple queries hook
- `useIsFetching` - Check if queries are fetching
- `useIsMutating` - Check if mutations are running
- `useIsRestoring` - Check if queries are restoring

### Classes & Functions

- `QueryClient` - Query client class
- `QueryCache` - Query cache
- `MutationCache` - Mutation cache
- `focusManager` - Focus manager utility
- `onlineManager` - Online manager utility
- `infiniteQueryOptions` - Infinite query options helper
- `queryOptions` - Query options helper
- `mutationOptions` - Mutation options helper

### Types

All TypeScript types from TanStack Query are re-exported, including:

- `UseQueryResult`, `UseQueryOptions`
- `UseMutationResult`, `UseMutationOptions`
- `QueryKey`, `QueryFunction`, `MutationFunction`
- `QueryClientConfig`, `QueryState`, `MutationState`
- And many more...

## Examples

The following examples demonstrate patterns for creating your own hooks and query keys in your applications. These are illustrative examples, not actual exports from this package.

### Creating Query Hooks

#### Example 1: Basic Query Hook

```tsx
import { useQuery } from "@buildbase/tanstack-query";

interface User {
  id: string;
  name: string;
  email: string;
}

export const useUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: async (): Promise<User[]> => {
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

#### Example 2: Query Hook with Parameters

```tsx
export const useUser = (userId: string) => {
  return useQuery({
    queryKey: ["users", userId],
    queryFn: async (): Promise<User> => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }
      return response.json();
    },
    enabled: !!userId, // Only run if userId exists
  });
};
```

#### Example 3: Query Hook with Filters

```tsx
interface UserFilters {
  role?: string;
  status?: string;
}

export const useUsersWithFilters = (filters: UserFilters) => {
  return useQuery({
    queryKey: ["users", "filtered", filters],
    queryFn: async (): Promise<User[]> => {
      const params = new URLSearchParams();
      if (filters.role) params.append("role", filters.role);
      if (filters.status) params.append("status", filters.status);

      const response = await fetch(`/api/users?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    },
  });
};
```

#### Example 4: Dependent Queries

```tsx
interface UserProfile {
  userId: string;
  bio: string;
  avatar: string;
}

export const useUserProfile = (userId: string) => {
  const { data: user } = useUser(userId);

  return useQuery({
    queryKey: ["users", userId, "profile"],
    queryFn: async (): Promise<UserProfile> => {
      const response = await fetch(`/api/users/${userId}/profile`);
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      return response.json();
    },
    enabled: !!user, // Only run if user exists
  });
};
```

#### Example 5: Query with Custom Options

```tsx
export const useUsersWithCustomOptions = () => {
  return useQuery({
    queryKey: ["users", "custom"],
    queryFn: async (): Promise<User[]> => {
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};
```

### Creating Mutation Hooks

#### Example 1: Basic Mutation Hook

```tsx
import { useMutation, useQueryClient } from "@buildbase/tanstack-query";

interface CreateUserData {
  name: string;
  email: string;
}

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserData): Promise<User> => {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to create user");
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};
```

#### Example 2: Mutation with Optimistic Updates

```tsx
interface UpdateUserData {
  name?: string;
  email?: string;
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateUserData;
    }): Promise<User> => {
      const response = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to update user");
      }
      return response.json();
    },
    // Optimistic update - update UI immediately
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["users", id] });

      // Snapshot previous value
      const previousUser = queryClient.getQueryData<User>(["users", id]);

      // Optimistically update
      if (previousUser) {
        queryClient.setQueryData<User>(["users", id], {
          ...previousUser,
          ...data,
        });
      }

      return { previousUser };
    },
    // Rollback on error
    onError: (err, variables, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(["users", variables.id], context.previousUser);
      }
    },
    // Refetch on success to ensure consistency
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};
```

#### Example 3: Mutation with Error Handling

```tsx
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete user");
      }
    },
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ["users", id] });
      // Invalidate list to refetch
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: error => {
      // Handle error (show toast, log, etc.)
      console.error("Failed to delete user:", error);
      // toast.error("Failed to delete user");
    },
  });
};
```

### Using Hooks in Components

#### Example 1: Using Query Hook

```tsx
"use client";

import { useQuery } from "@buildbase/tanstack-query";

export function UsersList() {
  const {
    data: users,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["users"],
    queryFn: async (): Promise<User[]> => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  if (isLoading) return <div>Loading users...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={() => refetch()}>Refresh</button>
      <ul>
        {users?.map(user => (
          <li key={user.id}>
            {user.name} - {user.email}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

#### Example 2: Using Mutation Hook

```tsx
"use client";

import { useMutation, useQueryClient } from "@buildbase/tanstack-query";
import { useState } from "react";

export function CreateUserForm() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ name: "", email: "" });

  const createUser = useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
    }): Promise<User> => {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create user");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setFormData({ name: "", email: "" }); // Reset form
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate(formData, {
      onSuccess: () => {
        console.log("User created successfully!");
      },
      onError: error => {
        console.error("Failed to create user:", error);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Name"
        value={formData.name}
        onChange={e => setFormData({ ...formData, name: e.target.value })}
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={e => setFormData({ ...formData, email: e.target.value })}
      />
      <button type="submit" disabled={createUser.isPending}>
        {createUser.isPending ? "Creating..." : "Create User"}
      </button>
      {createUser.isError && <div>Error: {createUser.error?.message}</div>}
    </form>
  );
}
```

#### Example 3: Combining Query and Mutation

```tsx
"use client";

import { useQuery, useMutation, useQueryClient } from "@buildbase/tanstack-query";
import { useState } from "react";

export function UserManagement() {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Query for users list
  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async (): Promise<User[]> => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  // Query for selected user
  const { data: selectedUser } = useQuery({
    queryKey: ["users", selectedUserId],
    queryFn: async (): Promise<User> => {
      const response = await fetch(`/api/users/${selectedUserId}`);
      if (!response.ok) throw new Error("Failed to fetch user");
      return response.json();
    },
    enabled: !!selectedUserId,
  });

  // Update mutation
  const updateUser = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<User>;
    }): Promise<User> => {
      const response = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update user");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  // Delete mutation
  const deleteUser = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete user");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setSelectedUserId(null);
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <div>
        <h2>Users</h2>
        <ul>
          {users?.map(user => (
            <li key={user.id}>
              <button onClick={() => setSelectedUserId(user.id)}>
                {user.name}
              </button>
              <button
                onClick={() => deleteUser.mutate(user.id)}
                disabled={deleteUser.isPending}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>

      {selectedUser && (
        <div>
          <h2>Edit User</h2>
          <button
            onClick={() =>
              updateUser.mutate({
                id: selectedUser.id,
                data: { name: "Updated Name" },
              })
            }
            disabled={updateUser.isPending}
          >
            {updateUser.isPending ? "Updating..." : "Update"}
          </button>
        </div>
      )}
    </div>
  );
}
```

### Organizing Query Keys

#### Example 1: Basic Query Keys Structure

```tsx
export const queryKeys = {
  // Users
  users: {
    all: ["users"] as const,
    lists: () => [...queryKeys.users.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      filters ? [...queryKeys.users.lists(), filters] : queryKeys.users.lists(),
    details: () => [...queryKeys.users.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },

  // Posts
  posts: {
    all: ["posts"] as const,
    lists: () => [...queryKeys.posts.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      filters ? [...queryKeys.posts.lists(), filters] : queryKeys.posts.lists(),
    details: () => [...queryKeys.posts.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.posts.details(), id] as const,
  },

  // Auth
  auth: {
    all: ["auth"] as const,
    user: () => [...queryKeys.auth.all, "user"] as const,
    session: () => [...queryKeys.auth.all, "session"] as const,
  },
} as const;
```

#### Example 2: Using Query Keys in Hooks

```tsx
import { useQuery } from "@buildbase/tanstack-query";
import { queryKeys } from "./query-keys";

export const useUsers = () => {
  return useQuery({
    queryKey: queryKeys.users.lists(), // ["users", "list"]
    queryFn: async () => {
      // Fetch users
      return [];
    },
  });
};

export const useUser = (id: string) => {
  return useQuery({
    queryKey: queryKeys.users.detail(id), // ["users", "detail", id]
    queryFn: async () => {
      // Fetch user by id
      return null;
    },
  });
};
```

#### Example 3: Invalidating Query Keys

```tsx
import { useQueryClient } from "@buildbase/tanstack-query";
import { queryKeys } from "./query-keys";

export const useInvalidateUsers = () => {
  const queryClient = useQueryClient();

  // Invalidate all user queries
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
  };

  // Invalidate specific user
  const invalidateUser = (id: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) });
  };

  // Invalidate all lists
  const invalidateLists = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
  };

  return { invalidateAll, invalidateUser, invalidateLists };
};
```

#### Example 4: Advanced Query Keys with Pagination

```tsx
export const advancedQueryKeys = {
  users: {
    all: ["users"] as const,
    lists: () => [...advancedQueryKeys.users.all, "list"] as const,
    list: (page: number, limit: number) =>
      [...advancedQueryKeys.users.lists(), { page, limit }] as const,
    search: (query: string) =>
      [...advancedQueryKeys.users.all, "search", query] as const,
    filters: (filters: { role?: string; status?: string }) =>
      [...advancedQueryKeys.users.all, "filtered", filters] as const,
  },
} as const;
```

#### Example 5: Nested Query Keys

```tsx
export const nestedQueryKeys = {
  workspaces: {
    all: ["workspaces"] as const,
    lists: () => [...nestedQueryKeys.workspaces.all, "list"] as const,
    detail: (workspaceId: string) =>
      [...nestedQueryKeys.workspaces.all, "detail", workspaceId] as const,
    members: (workspaceId: string) =>
      [...nestedQueryKeys.workspaces.detail(workspaceId), "members"] as const,
    member: (workspaceId: string, memberId: string) =>
      [...nestedQueryKeys.workspaces.members(workspaceId), memberId] as const,
    settings: (workspaceId: string) =>
      [...nestedQueryKeys.workspaces.detail(workspaceId), "settings"] as const,
  },
} as const;
```

## Features

- Pre-configured QueryClient with sensible defaults
- Type-safe query keys
- Custom hooks for common operations
- React Query DevTools in development
- Query invalidation helpers
- Smart retry logic (doesn't retry on 4xx errors)
- Automatic refetch on reconnect
