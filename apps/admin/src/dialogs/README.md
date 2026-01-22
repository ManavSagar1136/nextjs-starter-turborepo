# Admin App Dialogs

This directory contains all dialog components and setup for the admin app.

## Structure

```
dialogs/
├── setup.ts              # Dialog registration and setup
├── initialize.tsx        # Client-side initialization component
├── index.ts              # Barrel exports for dialog components
├── components/            # Dialog component files
│   └── .gitkeep
└── README.md             # This file
```

## Adding a New Dialog

### 1. Create the Dialog Component

Create your dialog component in `components/`:

```tsx
// dialogs/components/CreateUserDialog.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@buildbase/ui/dialog";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Your custom props
}

export default function CreateUserDialog({
  open,
  onOpenChange,
}: CreateUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
        </DialogHeader>
        {/* Your dialog content */}
      </DialogContent>
    </Dialog>
  );
}
```

### 2. Register the Dialog

Add it to `setup.ts`:

```tsx
// dialogs/setup.ts
import CreateUserDialog from "./components/CreateUserDialog";

export function setupAdminDialogs() {
  setupAppDialogs({
    dialogs: {
      "admin:create-user": CreateUserDialog, // Eager load (frequently used)
    },
  });

  // Or lazy load for heavy/rarely-used dialogs:
  // dialogRegistry.registerLazy(
  //   "admin:bulk-operations",
  //   createLazyDialogLoader(() => import("./components/BulkOperationsDialog"))
  // );
}
```

### 3. Export from Index (Optional)

```tsx
// dialogs/index.ts
export { default as CreateUserDialog } from "./components/CreateUserDialog";
```

### 4. Use the Dialog

```tsx
import { useDialogManager } from "@buildbase/dialog-manager";

function MyComponent() {
  const { openDialog } = useDialogManager();

  const handleCreate = () => {
    openDialog("admin:create-user", {
      // props (excluding open and onOpenChange)
    });
  };

  return <button onClick={handleCreate}>Create User</button>;
}
```

## Dialog Naming Convention

Use the pattern: `{app}:{action}` or `{feature}:{action}`

- ✅ `"admin:create-user"`
- ✅ `"admin:manage-permissions"`
- ✅ `"admin:bulk-operations"`
- ❌ `"createUser"` (not namespaced)
- ❌ `"edit"` (too generic)

## Eager vs Lazy Loading

**Eager Load** (in `setupAppDialogs`):

- Frequently used dialogs
- Small, simple dialogs
- Dialogs that need instant opening

**Lazy Load** (with `registerLazy`):

- Rarely used dialogs
- Heavy dialogs with large dependencies
- Secondary/advanced features
