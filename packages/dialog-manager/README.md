# Dialog Manager Package

A centralized, strongly-typed dialog management system for React applications. This package provides a dialog registry system where apps can register their own dialogs, and includes common dialogs (confirmation, alert) by default.

## Features

- ✅ **Type-safe** - Full TypeScript support with inferred prop types
- ✅ **Centralized Registry** - All dialogs registered in one place
- ✅ **Common Dialogs Included** - Confirmation and Alert dialogs built-in
- ✅ **Override Support** - Apps can override common dialogs
- ✅ **Multiple Instances** - Open the same dialog multiple times
- ✅ **Auto Cleanup** - Dialogs are automatically cleaned up after closing
- ✅ **URL Support** - Open dialogs via URL parameters (optional)

## Installation

This package is part of the monorepo and should be installed as a workspace dependency:

```json
{
  "dependencies": {
    "@buildbase/dialog-manager": "*"
  }
}
```

## Quick Start

### 1. Initialize Common Dialogs

In your app's root layout or providers file:

```tsx
import { initializeCommonDialogs } from "@buildbase/dialog-manager";

// Initialize common dialogs (confirmation, alert)
initializeCommonDialogs();
```

### 2. Wrap Your App with DialogProvider

```tsx
import { DialogProvider } from "@buildbase/dialog-manager/provider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <DialogProvider>{children}</DialogProvider>
      </body>
    </html>
  );
}
```

### 3. Use Dialogs

```tsx
import { useDialogManager, COMMON_DIALOG_KEYS } from "@buildbase/dialog-manager";

function MyComponent() {
  const { openDialog } = useDialogManager();

  const handleDelete = () => {
    openDialog(COMMON_DIALOG_KEYS.CONFIRMATION, {
      variant: "delete",
      title: "Delete Item?",
      description: "Are you sure you want to delete this item?",
      entity: "item",
      confirmButtonProps: {
        onAction: async () => {
          // Your delete logic here
          await deleteItem();
          return { success: true };
        },
      },
    });
  };

  return <button onClick={handleDelete}>Delete</button>;
}
```

## Registering Custom Dialogs

### Recommended: App Setup Pattern

The recommended approach is to use `setupAppDialogs()` in a dedicated setup file:

```tsx
// apps/user/src/dialogs/setup.ts
import {
  setupAppDialogs,
  createLazyDialogLoader,
} from "@buildbase/dialog-manager/app-setup";
import { dialogRegistry } from "@buildbase/dialog-manager/registry";
import CreateUserDialog from "./CreateUserDialog";
import EditUserDialog from "./EditUserDialog";

export function setupUserDialogs() {
  // Register frequently used dialogs (eager load)
  setupAppDialogs({
    dialogs: {
      "user:create": CreateUserDialog,
      "user:edit": EditUserDialog,
    },
    initializeCommon: true, // Includes confirmation & alert dialogs
  });

  // Register lazy-loaded dialogs (loaded on-demand)
  dialogRegistry.registerLazy(
    "user:bulk-import",
    createLazyDialogLoader(() => import("./BulkImportDialog"))
  );
}
```

Then call it in your app's layout:

```tsx
// apps/user/src/app/layout.tsx
import { setupUserDialogs } from "@/dialogs/setup";

if (typeof window !== "undefined") {
  setupUserDialogs();
}
```

### Alternative: Direct Registry Access

For more control, you can use the registry directly:

```tsx
import { dialogRegistry } from "@buildbase/dialog-manager/registry";
import MyCustomDialog from "./MyCustomDialog";

// Register a dialog
dialogRegistry.register("my-custom-dialog", MyCustomDialog, {
  override: true, // Override if already exists
});

// Register lazy-loaded dialog
dialogRegistry.registerLazy("my-lazy-dialog", () => import("./MyLazyDialog"));
```

### Override Common Dialogs

```tsx
import { dialogRegistry, COMMON_DIALOG_KEYS } from "@buildbase/dialog-manager";
import MyCustomConfirmationDialog from "./MyCustomConfirmationDialog";

// Override the default confirmation dialog
dialogRegistry.register(
  COMMON_DIALOG_KEYS.CONFIRMATION,
  MyCustomConfirmationDialog,
  { override: true }
);
```

## Dialog Component Structure

Your dialog components should follow this structure:

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@buildbase/ui/dialog";

interface MyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Your custom props here
  title?: string;
  data?: any;
}

export default function MyDialog({
  open,
  onOpenChange,
  title,
  data,
}: MyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {/* Your dialog content */}
      </DialogContent>
    </Dialog>
  );
}
```

## Common Dialogs

### Confirmation Dialog

```tsx
import {
  useDialogManager,
  COMMON_DIALOG_KEYS,
  CONFIRMATION_DIALOG_VARIANTS,
} from "@buildbase/dialog-manager";

const { openDialog } = useDialogManager();

openDialog(COMMON_DIALOG_KEYS.CONFIRMATION, {
  variant: CONFIRMATION_DIALOG_VARIANTS.DELETE,
  title: "Delete Item?",
  description: "This action cannot be undone.",
  entity: "item",
  itemName: "My Item",
  confirmButtonProps: {
    onAction: async payload => {
      await deleteItem(payload);
      return { success: true, message: "Item deleted successfully" };
    },
    showToast: true,
  },
});
```

### Alert Dialog

```tsx
import {
  useDialogManager,
  COMMON_DIALOG_KEYS,
  ALERT_DIALOG_VARIANTS,
} from "@buildbase/dialog-manager";

const { openDialog } = useDialogManager();

openDialog(COMMON_DIALOG_KEYS.ALERT, {
  variant: ALERT_DIALOG_VARIANTS.SUCCESS,
  title: "Success!",
  description: "Your action was completed successfully.",
  onConfirm: () => {
    console.log("User confirmed");
  },
});
```

## API Reference

### `useDialogManager()`

Hook to access the dialog manager context.

**Returns:**

- `openDialog(key, props, id?)` - Open a dialog
- `closeDialog(id)` - Close a dialog by ID
- `forceCloseAllDialogs()` - Close all open dialogs

### `dialogRegistry`

Global registry instance for managing dialogs.

**Methods:**

- `register(key, component, options?)` - Register a dialog
- `registerMany(components, options?)` - Register multiple dialogs
- `get(key)` - Get a dialog component
- `has(key)` - Check if a dialog is registered
- `getAll()` - Get all registered dialogs
- `unregister(key)` - Remove a dialog
- `clear()` - Clear all dialogs

### `createDialogRegistry()`

Create a new dialog registry controller instance.

### `initializeCommonDialogs()`

Initialize common dialogs (confirmation, alert) in the registry.

### `buildDialogUrl(rootPath, dialogKey, props?)`

Build a URL for opening a dialog via URL parameters.

## TypeScript Support

The dialog manager is fully typed. When you register a dialog, TypeScript will infer the correct props:

```tsx
// TypeScript knows the exact props for your dialog
openDialog("my-dialog", {
  title: "Hello", // ✅ TypeScript knows this prop exists
  invalidProp: "test", // ❌ TypeScript error
});
```

## Best Practices

1. **Initialize common dialogs early** - Call `initializeCommonDialogs()` in your app's entry point
2. **Register dialogs before rendering** - Register all dialogs before the first render
3. **Use descriptive keys** - Use clear, descriptive keys for your dialogs
4. **Override carefully** - Only override common dialogs if you have a good reason
5. **Type your dialogs** - Define proper TypeScript interfaces for your dialog props

## Architecture

For detailed information about the architecture, best practices, and how to structure dialogs in your app, see [ARCHITECTURE.md](./ARCHITECTURE.md).

### Quick Summary

- **Single DialogProvider** per app (in `AppProviders`)
- **App-level registration** - Each app registers its dialogs in a setup file
- **Lazy loading support** - Dialogs can be loaded on-demand for better performance
- **Type-safe** - Full TypeScript support with inferred types

## Examples

### Basic Setup

```tsx
// apps/user/src/dialogs/setup.ts
import { setupAppDialogs } from "@buildbase/dialog-manager/app-setup";
import { UserDialogs } from "./user-dialogs";

export function setupUserDialogs() {
  setupAppDialogs({
    dialogs: UserDialogs,
    initializeCommon: true,
  });
}
```

```tsx
// apps/user/src/app/layout.tsx
import { setupUserDialogs } from "@/dialogs/setup";

if (typeof window !== "undefined") {
  setupUserDialogs();
}

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
```

```tsx
// apps/user/src/components/providers/AppProviders.tsx
import { DialogProvider } from "@buildbase/dialog-manager/provider";

export function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <DialogProvider>{children}</DialogProvider>
    </ThemeProvider>
  );
}
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for more complete examples.
