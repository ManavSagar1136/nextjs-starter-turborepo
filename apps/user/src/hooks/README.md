# TanStack Query Hooks Pattern

This directory contains custom React Query hooks for the user app.

## Structure

```
hooks/
├── query-keys.ts      # Centralized query keys for type safety
├── use-auth.ts        # Authentication-related queries and mutations
└── README.md          # This file
```

## Creating Query Hooks

### Basic Query Hook

```tsx
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import { API } from "@/services";

export const useUsers = () => {
  return useQuery({
    queryKey: queryKeys.users.lists(),
    queryFn: async () => {
      const response = await API.users.getAll();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

### Query Hook with Parameters

```tsx
export const useUser = (id: string) => {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: async () => {
      const response = await API.users.getById(id);
      return response.data;
    },
    enabled: !!id, // Only run if id exists
  });
};
```

### Query Hook with Filters

```tsx
export const useUsersWithFilters = (filters: {
  role?: string;
  status?: string;
}) => {
  return useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: async () => {
      const response = await API.users.getAll(filters);
      return response.data;
    },
  });
};
```

## Creating Mutation Hooks

### Basic Mutation Hook

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import { API } from "@/services";

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserData) => {
      const response = await API.users.create(data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
  });
};
```

### Mutation with Optimistic Updates

```tsx
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserData }) => {
      const response = await API.users.update(id, data);
      return response.data;
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.users.detail(id) });

      // Snapshot previous value
      const previousUser = queryClient.getQueryData(queryKeys.users.detail(id));

      // Optimistically update
      queryClient.setQueryData(queryKeys.users.detail(id), (old: any) => ({
        ...old,
        ...data,
      }));

      return { previousUser };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(
          queryKeys.users.detail(variables.id),
          context.previousUser
        );
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate to refetch
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
  });
};
```

### Mutation with Error Handling

```tsx
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await API.users.delete(id);
      return response.data;
    },
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.users.detail(id) });
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
    onError: error => {
      console.error("Failed to delete user:", error);
      // You can show a toast notification here
    },
  });
};
```

## Using Hooks in Components

```tsx
"use client";

import { useUsers, useCreateUser } from "@/hooks/use-users";
import { Button } from "@buildbase/ui/components/ui/button";

export function UsersList() {
  const { data: users, isLoading, error } = useUsers();
  const createUser = useCreateUser();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const handleCreate = () => {
    createUser.mutate(
      { name: "New User", email: "user@example.com" },
      {
        onSuccess: () => {
          console.log("User created!");
        },
      }
    );
  };

  return (
    <div>
      <Button onClick={handleCreate} disabled={createUser.isPending}>
        {createUser.isPending ? "Creating..." : "Create User"}
      </Button>
      <ul>
        {users?.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Best Practices

1. **Always use query keys from `query-keys.ts`** - Ensures type safety and consistency
2. **Invalidate related queries** - When mutations succeed, invalidate affected queries
3. **Use `enabled` option** - Prevent queries from running when dependencies aren't ready
4. **Set appropriate `staleTime`** - Balance freshness vs performance
5. **Handle errors gracefully** - Use `onError` callbacks for mutations
6. **Use optimistic updates** - For better UX when appropriate
