# Dialog Manager Usage Guide

## Base Props Interface

All dialogs and sheets registered with the dialog manager **must** extend the `DialogOrSheetBaseProps` interface. This ensures type safety and guarantees that all components have the required props that the dialog manager needs to control them.

### DialogOrSheetBaseProps

```tsx
import type { DialogOrSheetBaseProps } from "@buildbase/dialog-manager/base-props";

interface DialogOrSheetBaseProps {
  // Required props (managed by dialog manager)
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // Optional props (can be passed through to customize behavior)
  modal?: boolean; // Whether dialog blocks interaction with rest of page (default: true)
  onEscapeKeyDown?: (event: KeyboardEvent) => void; // Called when Escape key is pressed
  onPointerDownOutside?: (event: PointerEvent) => void; // Called when pointer down outside
  onInteractOutside?: (
    event: PointerEvent | FocusEvent | MouseEvent | TouchEvent
  ) => void; // Called on any outside interaction
  onFocusOutside?: (event: FocusEvent) => void; // Called when focus moves outside
  onCloseAutoFocus?: (event: Event) => void; // Called when focus should be restored after close
  onOpenAutoFocus?: (event: Event) => void; // Called when focus should be set on open
}
```

**Note:** The `open` and `onOpenChange` props are **required** and managed by the dialog manager. The optional props can be passed when opening a dialog to customize behavior, but they are not required when defining your component interface.

## Creating a Dialog Component

### Example 1: Dialog Component

```tsx
// apps/user/src/dialogs/components/CreateUserDialog.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@buildbase/ui/dialog";
import type { DialogOrSheetBaseProps } from "@buildbase/dialog-manager/base-props";

// ✅ Extend DialogOrSheetBaseProps
interface CreateUserDialogProps extends DialogOrSheetBaseProps {
  title?: string;
  userId?: string;
  onSuccess?: () => void;
}

export default function CreateUserDialog({
  open,
  onOpenChange,
  title,
  userId,
  onSuccess,
}: CreateUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title || "Create User"}</DialogTitle>
        </DialogHeader>
        {/* Your dialog content */}
      </DialogContent>
    </Dialog>
  );
}
```

### Example 2: Sheet Component

```tsx
// apps/user/src/dialogs/components/UserSettingsSheet.tsx
"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@buildbase/ui/sheet";
import type { DialogOrSheetBaseProps } from "@buildbase/dialog-manager/base-props";

// ✅ Extend DialogOrSheetBaseProps
interface UserSettingsSheetProps extends DialogOrSheetBaseProps {
  userId: string;
  onSave?: (settings: any) => void;
}

export default function UserSettingsSheet({
  open,
  onOpenChange,
  userId,
  onSave,
}: UserSettingsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>User Settings</SheetTitle>
        </SheetHeader>
        {/* Your sheet content */}
      </SheetContent>
    </Sheet>
  );
}
```

## Registering Components

### Register Dialog

```tsx
// apps/user/src/dialogs/setup.ts
import { setupAppDialogs } from "@buildbase/dialog-manager/app-setup";
import CreateUserDialog from "./components/CreateUserDialog";

export function setupUserDialogs() {
  setupAppDialogs({
    dialogs: {
      "user:create": CreateUserDialog, // ✅ Must extend DialogOrSheetBaseProps
    },
    initializeCommon: true,
  });
}
```

### Register Sheet

```tsx
// apps/user/src/dialogs/setup.ts
import { setupAppDialogs } from "@buildbase/dialog-manager/app-setup";
import UserSettingsSheet from "./components/UserSettingsSheet";

export function setupUserDialogs() {
  setupAppDialogs({
    dialogs: {
      "user:settings": UserSettingsSheet, // ✅ Must extend DialogOrSheetBaseProps
    },
    initializeCommon: true,
  });
}
```

### Register Both Dialog and Sheet

```tsx
// apps/user/src/dialogs/setup.ts
import { setupAppDialogs } from "@buildbase/dialog-manager/app-setup";
import CreateUserDialog from "./components/CreateUserDialog";
import UserSettingsSheet from "./components/UserSettingsSheet";

export function setupUserDialogs() {
  setupAppDialogs({
    dialogs: {
      "user:create": CreateUserDialog, // Dialog
      "user:settings": UserSettingsSheet, // Sheet
    },
    initializeCommon: true,
  });
}
```

## Type Safety

The dialog manager enforces type safety at compile time. If your component doesn't extend `DialogOrSheetBaseProps`, TypeScript will show an error:

```tsx
// ❌ This will cause a TypeScript error
interface BadDialogProps {
  title: string; // Missing open and onOpenChange
}

function BadDialog({ title }: BadDialogProps) {
  return <div>{title}</div>;
}

// Error: Type 'BadDialog' is not assignable to type 'DialogOrSheetComponent<DialogOrSheetBaseProps>'
setupAppDialogs({
  dialogs: {
    "bad:dialog": BadDialog, // ❌ TypeScript error!
  },
});
```

```tsx
// ✅ This is correct
interface GoodDialogProps extends DialogOrSheetBaseProps {
  title: string;
}

function GoodDialog({ open, onOpenChange, title }: GoodDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>{title}</DialogContent>
    </Dialog>
  );
}

// ✅ No error
setupAppDialogs({
  dialogs: {
    "good:dialog": GoodDialog, // ✅ Works!
  },
});
```

## Using Custom Props

When opening a dialog, you only pass the custom props (not the base props managed by the dialog manager):

```tsx
import { useDialogManager } from "@buildbase/dialog-manager";

function MyComponent() {
  const { openDialog } = useDialogManager();

  const handleCreate = () => {
    // ✅ Only pass custom props
    openDialog("user:create", {
      title: "Create New User",
      userId: "123",
      onSuccess: () => console.log("Success!"),
    });
    // ❌ Don't pass base props - they're managed automatically:
    // - open, onOpenChange (required, managed by dialog manager)
    // - modal, onEscapeKeyDown, etc. (optional, can be passed if needed)
  };
}
```

## Callbacks on Dialog State Changes

You can receive callbacks when a dialog opens or closes, even if it's closed from outside (Escape key, outside click, etc.):

```tsx
import { useDialogManager } from "@buildbase/dialog-manager";

function MyComponent() {
  const { openDialog } = useDialogManager();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreate = () => {
    const dialogId = openDialog(
      "user:create",
      {
        title: "Create New User",
        userId: "123",
      },
      {
        // ✅ Callback when dialog opens
        onOpen: () => {
          console.log("Dialog opened!");
          setIsDialogOpen(true);
        },
        // ✅ Callback when dialog closes (from anywhere)
        onClose: () => {
          console.log("Dialog closed!");
          setIsDialogOpen(false);
          // Refresh data, update UI, etc.
        },
      }
    );
  };

  return (
    <div>
      <button onClick={handleCreate}>Create User</button>
      {isDialogOpen && <p>Dialog is open...</p>}
    </div>
  );
}
```

**Key Points:**

- `onOpen` is called when the dialog is first opened
- `onClose` is called **regardless of how the dialog closes**:
  - Escape key pressed
  - Outside click
  - Close button clicked
  - Programmatic close via `closeDialog()`
- These callbacks are called in the component that opened the dialog, not inside the dialog component itself

### Passing Optional Base Props

You can pass optional base props to customize dialog behavior:

```tsx
const handleCreate = () => {
  openDialog("user:create", {
    title: "Create New User",
    userId: "123",
    // Optional: Customize behavior
    modal: false, // Allow interaction with rest of page
    onEscapeKeyDown: e => {
      // Prevent closing on Escape
      e.preventDefault();
      console.log("Escape pressed but dialog stays open");
    },
    onInteractOutside: e => {
      // Prevent closing on outside click
      e.preventDefault();
    },
  });
};
```

## Type Helper: DialogOrSheetCustomProps

Use this helper to extract only the custom props from your component:

```tsx
import type { DialogOrSheetCustomProps } from "@buildbase/dialog-manager/base-props";

interface MyDialogProps extends DialogOrSheetBaseProps {
  title: string;
  data: any;
}

// This type will be: { title: string; data: any; }
type MyDialogCustomProps = DialogOrSheetCustomProps<MyDialogProps>;
```

## Best Practices

1. **Always extend DialogOrSheetBaseProps**:

   ```tsx
   interface MyDialogProps extends DialogOrSheetBaseProps {
     // Your custom props
   }
   ```

2. **Use descriptive prop names**:

   ```tsx
   // ✅ Good
   interface CreateUserDialogProps extends DialogOrSheetBaseProps {
     initialData?: UserData;
     onSuccess?: (user: User) => void;
   }

   // ❌ Avoid
   interface CreateUserDialogProps extends DialogOrSheetBaseProps {
     data?: any; // Too generic
     cb?: () => void; // Unclear
   }
   ```

3. **Don't override base props**:

   ```tsx
   // ❌ Don't do this
   interface BadProps extends DialogOrSheetBaseProps {
     open?: boolean; // Conflicts with base prop
     onOpenChange?: (open: boolean) => void; // Conflicts with base prop
   }
   ```

4. **Use TypeScript for type safety**:
   ```tsx
   // ✅ TypeScript will catch missing props
   export type UserAppDialogs = {
     "user:create": typeof CreateUserDialog;
     "user:edit": typeof EditUserDialog;
   } & DialogComponentMap;
   ```

## Common Patterns

### Pattern 1: Simple Dialog

```tsx
interface SimpleDialogProps extends DialogOrSheetBaseProps {
  message: string;
}

export default function SimpleDialog({
  open,
  onOpenChange,
  message,
}: SimpleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <p>{message}</p>
      </DialogContent>
    </Dialog>
  );
}
```

### Pattern 2: Dialog with Callbacks

```tsx
interface DialogWithCallbacksProps extends DialogOrSheetBaseProps {
  onConfirm: () => Promise<void>;
  onCancel?: () => void;
}

export default function DialogWithCallbacks({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}: DialogWithCallbacksProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <button onClick={handleConfirm}>Confirm</button>
        <button
          onClick={() => {
            onCancel?.();
            onOpenChange(false);
          }}
        >
          Cancel
        </button>
      </DialogContent>
    </Dialog>
  );
}
```

### Pattern 3: Sheet Component

```tsx
interface SettingsSheetProps extends DialogOrSheetBaseProps {
  userId: string;
  onSave: (settings: Settings) => void;
}

export default function SettingsSheet({
  open,
  onOpenChange,
  userId,
  onSave,
}: SettingsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>
        {/* Settings form */}
      </SheetContent>
    </Sheet>
  );
}
```

## Summary

- ✅ Always extend `DialogOrSheetBaseProps` in your dialog/sheet component props
- ✅ The dialog manager automatically handles `open` and `onOpenChange`
- ✅ Only pass custom props when calling `openDialog()`
- ✅ Use `onOpen` and `onClose` callbacks in the options parameter to track dialog state changes from the component that opened it
- ✅ TypeScript will catch any components that don't extend the base props
- ✅ Works with both Dialog and Sheet components from Radix UI

## Complete Example: Dialog with Callbacks

```tsx
import { useDialogManager } from "@buildbase/dialog-manager";
import { useState } from "react";

function UserList() {
  const { openDialog } = useDialogManager();
  const [lastAction, setLastAction] = useState<string | null>(null);

  const handleEdit = (userId: string) => {
    openDialog(
      "user:edit",
      {
        userId,
        title: "Edit User",
      },
      {
        onOpen: () => {
          console.log("Edit dialog opened for user:", userId);
          setLastAction(null);
        },
        onClose: () => {
          console.log("Edit dialog closed");
          setLastAction("User edit dialog was closed");
          // Refresh user list, show toast, etc.
        },
      }
    );
  };

  return (
    <div>
      <button onClick={() => handleEdit("123")}>Edit User</button>
      {lastAction && <p>{lastAction}</p>}
    </div>
  );
}
```

This pattern is especially useful when you need to:

- Refresh data after a dialog closes
- Update UI state based on dialog open/close
- Track analytics events
- Show notifications when dialogs close
- Clean up resources when dialogs close
