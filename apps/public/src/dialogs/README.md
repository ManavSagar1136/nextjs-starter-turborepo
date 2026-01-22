# Public App Dialogs

This directory contains all dialogs for the public app, including setup, constants, and dialog components.

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
export const PUBLIC_DIALOG_KEYS = {
  CONTACT: "public:contact",
  NEWSLETTER: "public:newsletter",
  INPUT: "public:input",
} as const;
```

### 2. Register Dialogs in `setup.ts`

```typescript
import { PUBLIC_DIALOG_KEYS } from "./constants";
import ContactDialog from "./components/ContactDialog";

export type PublicAppDialogs = {
  [PUBLIC_DIALOG_KEYS.CONTACT]: typeof ContactDialog;
} & DialogComponentMap;

export function setupPublicDialogs() {
  setupAppDialogs<PublicAppDialogs>({
    dialogs: {
      [PUBLIC_DIALOG_KEYS.CONTACT]: ContactDialog,
    },
    initializeCommon: true,
  });
}
```

### 3. Use Constants When Opening Dialogs

```typescript
import { useDialogManager } from "@buildbase/dialog-manager";
import { PUBLIC_DIALOG_KEYS } from "@/dialogs/constants";

function MyComponent() {
  const { openDialog } = useDialogManager();

  const handleOpenContact = () => {
    openDialog(PUBLIC_DIALOG_KEYS.CONTACT, {
      title: "Contact Us",
      // ... other props
    });
  };

  return <button onClick={handleOpenContact}>Open Contact</button>;
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
   export const PUBLIC_DIALOG_KEYS = {
     // ... existing keys
     MY_NEW_DIALOG: "public:my-new-dialog",
   } as const;
   ```

2. **Create the dialog component** in `components/MyNewDialog.tsx`

3. **Register it in `setup.ts`**:
   ```typescript
   import MyNewDialog from "./components/MyNewDialog";
   
   export type PublicAppDialogs = {
     // ... existing dialogs
     [PUBLIC_DIALOG_KEYS.MY_NEW_DIALOG]: typeof MyNewDialog;
   } & DialogComponentMap;
   
   setupAppDialogs<PublicAppDialogs>({
     dialogs: {
       // ... existing dialogs
       [PUBLIC_DIALOG_KEYS.MY_NEW_DIALOG]: MyNewDialog,
     },
   });
   ```

4. **Use it in your components**:
   ```typescript
   import { PUBLIC_DIALOG_KEYS } from "@/dialogs/constants";
   
   openDialog(PUBLIC_DIALOG_KEYS.MY_NEW_DIALOG, { /* props */ });
   ```

## Importing Constants

You can import constants from the main dialogs export:

```typescript
// Import from main dialogs export
import { PUBLIC_DIALOG_KEYS, ALL_DIALOG_KEYS } from "@/dialogs";

// Or import directly
import { PUBLIC_DIALOG_KEYS } from "@/dialogs/constants";
```

## Common Dialogs

Common dialogs (confirmation, alert) are available via `COMMON_DIALOG_KEYS`:

```typescript
import { COMMON_DIALOG_KEYS } from "@buildbase/dialog-manager";

openDialog(COMMON_DIALOG_KEYS.CONFIRMATION, { /* props */ });
```

Or use the combined `ALL_DIALOG_KEYS` which includes both common and app-specific:

```typescript
import { ALL_DIALOG_KEYS } from "@/dialogs";

openDialog(ALL_DIALOG_KEYS.CONFIRMATION, { /* props */ });
openDialog(ALL_DIALOG_KEYS.CONTACT, { /* props */ });
```
