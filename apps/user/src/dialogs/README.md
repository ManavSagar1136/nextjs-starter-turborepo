# User App Dialogs

This directory contains all dialogs for the user app, including setup, constants, and dialog components.

## Structure

```
dialogs/
├── constants.ts      # Dialog key constants (single source of truth)
├── setup.ts         # Dialog registration and setup
├── index.ts         # Main exports
├── components/      # Dialog components
└── README.md        # This file
```

## Using Dialog Constants

### 1. Define Dialog Keys in `constants.ts`

```typescript
export const USER_DIALOG_KEYS = {
  CREATE: "user:create",
  EDIT: "user:edit",
  SETTINGS: "user:settings",
} as const;
```

### 2. Register Dialogs in `setup.ts`

```typescript
import { USER_DIALOG_KEYS } from "./constants";
import CreateDialog from "./components/CreateDialog";

export type UserAppDialogs = {
  [USER_DIALOG_KEYS.CREATE]: typeof CreateDialog;
} & DialogComponentMap;

export function setupUserDialogs() {
  setupAppDialogs<UserAppDialogs>({
    dialogs: {
      [USER_DIALOG_KEYS.CREATE]: CreateDialog,
    },
    initializeCommon: true,
  });
}
```

### 3. Use Constants When Opening Dialogs

```typescript
import { useDialogManager } from "@buildbase/dialog-manager";
import { USER_DIALOG_KEYS } from "@/dialogs/constants";

function MyComponent() {
  const { openDialog } = useDialogManager();

  const handleOpenCreate = () => {
    openDialog(USER_DIALOG_KEYS.CREATE, {
      title: "Create Item",
      // ... other props
    });
  };

  return <button onClick={handleOpenCreate}>Create</button>;
}
```

## Benefits

✅ **Type Safety** - TypeScript will catch typos and invalid keys  
✅ **Single Source of Truth** - All keys defined in one place  
✅ **Refactoring** - Easy to rename keys across the entire app  
✅ **Autocomplete** - IDE autocomplete for dialog keys  
✅ **Consistency** - Ensures consistent naming across the app

## Adding a New Dialog

1. **Add the key to `constants.ts`**:

   ```typescript
   export const USER_DIALOG_KEYS = {
     // ... existing keys
     MY_NEW_DIALOG: "user:my-new-dialog",
   } as const;
   ```

2. **Create the dialog component** in `components/MyNewDialog.tsx`

3. **Register it in `setup.ts`**:

   ```typescript
   import MyNewDialog from "./components/MyNewDialog";

   export type UserAppDialogs = {
     // ... existing dialogs
     [USER_DIALOG_KEYS.MY_NEW_DIALOG]: typeof MyNewDialog;
   } & DialogComponentMap;

   setupAppDialogs<UserAppDialogs>({
     dialogs: {
       // ... existing dialogs
       [USER_DIALOG_KEYS.MY_NEW_DIALOG]: MyNewDialog,
     },
   });
   ```

4. **Use it in your components**:

   ```typescript
   import { USER_DIALOG_KEYS } from "@/dialogs/constants";

   openDialog(USER_DIALOG_KEYS.MY_NEW_DIALOG, {
     /* props */
   });
   ```

## Importing Constants

You can import constants from the main dialogs export:

```typescript
// Import from main dialogs export
import { USER_DIALOG_KEYS, ALL_DIALOG_KEYS } from "@/dialogs";

// Or import directly
import { USER_DIALOG_KEYS } from "@/dialogs/constants";
```

## Common Dialogs

Common dialogs (confirmation, alert) are available via `COMMON_DIALOG_KEYS`:

```typescript
import { COMMON_DIALOG_KEYS } from "@buildbase/dialog-manager";

openDialog(COMMON_DIALOG_KEYS.CONFIRMATION, {
  /* props */
});
```

Or use the combined `ALL_DIALOG_KEYS` which includes both common and app-specific:

```typescript
import { ALL_DIALOG_KEYS } from "@/dialogs";

openDialog(ALL_DIALOG_KEYS.CONFIRMATION, {
  /* props */
});
openDialog(ALL_DIALOG_KEYS.CREATE, {
  /* props */
});
```
