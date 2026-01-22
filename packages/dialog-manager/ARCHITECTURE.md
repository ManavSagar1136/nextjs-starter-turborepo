# Dialog Manager Architecture

## Overview

The dialog manager uses a **single DialogProvider with lazy loading support** architecture. This provides:

- ✅ **Single Provider** - One DialogProvider per app (efficient)
- ✅ **Lazy Loading** - Dialogs automatically loaded when opened (performance)
- ✅ **Type Safety** - Full TypeScript support
- ✅ **Clear Separation** - Each app manages its own dialogs
- ✅ **Code Splitting** - Automatic code splitting for lazy-loaded dialogs
- ✅ **Zero Configuration** - Lazy-loaded dialogs work automatically, no manual preloading needed

## Architecture Pattern

### 1. Single DialogProvider at App Level

Each app should have **one DialogProvider** in its `AppProviders` component:

```tsx
// apps/user/src/components/providers/AppProviders.tsx
import { DialogProvider } from "@buildbase/dialog-manager/provider";

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <ReduxProvider>
        <DialogProvider>{children}</DialogProvider>
      </ReduxProvider>
    </ThemeProvider>
  );
}
```

### 2. App-Specific Dialog Registration

Each app should create a dialogs setup file that registers its dialogs:

```tsx
// apps/user/src/dialogs/setup.ts
import {
  setupAppDialogs,
  createLazyDialogLoader,
} from "@buildbase/dialog-manager/app-setup";
import { dialogRegistry } from "@buildbase/dialog-manager/registry";
import type { DialogComponentMap } from "@buildbase/dialog-manager/types";

// Import your dialog components
import CreateUserDialog from "./components/CreateUserDialog";
import EditUserDialog from "./components/EditUserDialog";

export type UserAppDialogs = {
  "user:create": typeof CreateUserDialog;
  "user:edit": typeof EditUserDialog;
} & DialogComponentMap;

export function setupUserDialogs() {
  // Register frequently used dialogs (eager load)
  setupAppDialogs({
    dialogs: {
      "user:create": CreateUserDialog,
      "user:edit": EditUserDialog,
    },
    initializeCommon: true, // Initialize confirmation & alert dialogs
  });

  // Register lazy-loaded dialogs (loaded on-demand)
  dialogRegistry.registerLazy(
    "user:bulk-import",
    createLazyDialogLoader(() => import("./components/BulkImportDialog"))
  );
}
```

### 3. Create Initialization Component

Create a client-side component that initializes dialogs when the app loads:

```tsx
// apps/user/src/dialogs/initialize.tsx
"use client";

import { useEffect } from "react";
import { setupUserDialogs } from "./setup";

export function InitializeDialogs() {
  useEffect(() => {
    setupUserDialogs();
  }, []);

  return null;
}
```

### 4. Add to Root Layout

Add the initialization component to your app's root layout:

```tsx
// apps/user/src/app/layout.tsx
import { AppProviders } from "@/components/providers/AppProviders";
import { InitializeDialogs } from "@/dialogs/initialize";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AppProviders>
          <InitializeDialogs />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
```

## Lazy Loading Dialogs

**Recommended Approach: Lazy Load in Setup**

For dialogs that are rarely used or heavy, register them as lazy-loaded in your setup file. This approach:

- ✅ Keeps all dialog registration in one place
- ✅ Automatically loads dialogs when opened
- ✅ Provides better code splitting
- ✅ No need to manually preload before opening

### Lazy Load in Setup (Recommended)

```tsx
// apps/user/src/dialogs/setup.ts
import {
  setupAppDialogs,
  createLazyDialogLoader,
} from "@buildbase/dialog-manager/app-setup";
import { dialogRegistry } from "@buildbase/dialog-manager/registry";

export function setupUserDialogs() {
  // Register frequently used dialogs (eager load)
  setupAppDialogs({
    dialogs: {
      "user:create": CreateUserDialog,
      "user:edit": EditUserDialog,
      "user:delete": DeleteUserDialog,
    },
  });

  // Register lazy-loaded dialogs (loaded on-demand)
  dialogRegistry.registerLazy(
    "user:bulk-import",
    createLazyDialogLoader(() => import("./components/BulkImportDialog"))
  );

  dialogRegistry.registerLazy(
    "user:advanced-settings",
    createLazyDialogLoader(() => import("./components/AdvancedSettingsDialog"))
  );

  dialogRegistry.registerLazy(
    "user:export",
    createLazyDialogLoader(() => import("./components/ExportDialog"))
  );
}
```

**Usage:** Simply open the dialog as usual - it will automatically load when first opened:

```tsx
// In your component
import { useDialogManager } from "@buildbase/dialog-manager";

function MyComponent() {
  const { openDialog } = useDialogManager();

  const handleBulkImport = () => {
    // Dialog will be lazy-loaded automatically on first open
    openDialog("user:bulk-import", {
      // props
    });
  };
}
```

### Alternative: Manual Preloading (Advanced)

If you need to preload a lazy dialog before opening (e.g., on page navigation), you can use:

```tsx
import { dialogRegistry } from "@buildbase/dialog-manager/registry";

// Preload a single dialog
await dialogRegistry.preload("user:bulk-import");

// Preload multiple dialogs
await dialogRegistry.preloadMany([
  "user:bulk-import",
  "user:advanced-settings",
]);
```

## Best Practices

### 1. Dialog Naming Convention

Use a consistent naming pattern: `{app}:{action}` or `{feature}:{action}`

```tsx
// Good
"user:create";
"user:edit";
"user:delete";
"settings:profile";
"settings:preferences";

// Avoid
"createUser"; // Not namespaced
"edit"; // Too generic
```

### 2. Organize Dialogs by Feature

```tsx
// apps/user/src/dialogs/
├── setup.ts              // Main setup file
├── user-dialogs.ts       // User-related dialogs
├── settings-dialogs.ts   // Settings dialogs
├── billing-dialogs.ts    // Billing dialogs
└── components/
    ├── CreateUserDialog.tsx
    ├── EditUserDialog.tsx
    └── ...
```

### 3. When to Use Lazy Loading

**Use lazy loading for:**

- Dialogs that are rarely used (e.g., bulk operations, advanced settings)
- Heavy dialogs with large dependencies
- Dialogs that are only accessible to specific user roles
- Dialogs with heavy third-party libraries

**Don't lazy load:**

- Frequently used dialogs (confirmation, alert, create, edit)
- Small, simple dialogs
- Dialogs that need to open instantly (e.g., confirmation dialogs)

**Rule of thumb:** If a dialog is used in the main user flow, eager load it. If it's a secondary/advanced feature, lazy load it.

### 4. Preload Critical Dialogs

If you know a dialog will be needed soon, preload it:

```tsx
// Preload dialogs when user navigates to a page
useEffect(() => {
  dialogRegistry.preloadMany(["user:create", "user:edit"]);
}, []);
```

## Example: Complete App Setup

### File Structure

```
apps/user/src/
├── components/
│   └── providers/
│       └── AppProviders.tsx      # DialogProvider included here
├── dialogs/
│   ├── setup.ts                   # Dialog registration
│   ├── initialize.tsx             # Client-side initialization
│   ├── index.ts                   # Barrel exports
│   └── components/                # Dialog component files
│       ├── CreateUserDialog.tsx
│       ├── EditUserDialog.tsx
│       └── BulkImportDialog.tsx
└── app/
    └── layout.tsx                 # InitializeDialogs added here
```

### Complete Setup Example

**1. Dialog Setup File:**

```tsx
// apps/user/src/dialogs/setup.ts
import {
  setupAppDialogs,
  createLazyDialogLoader,
} from "@buildbase/dialog-manager/app-setup";
import { dialogRegistry } from "@buildbase/dialog-manager/registry";
import type { DialogComponentMap } from "@buildbase/dialog-manager/types";

// Import frequently used dialogs (eager load)
import CreateUserDialog from "./components/CreateUserDialog";
import EditUserDialog from "./components/EditUserDialog";
import DeleteUserDialog from "./components/DeleteUserDialog";

export type UserAppDialogs = {
  "user:create": typeof CreateUserDialog;
  "user:edit": typeof EditUserDialog;
  "user:delete": typeof DeleteUserDialog;
} & DialogComponentMap;

export function setupUserDialogs() {
  // Register frequently used dialogs (eager load)
  // These are loaded immediately when the app starts
  setupAppDialogs({
    dialogs: {
      "user:create": CreateUserDialog,
      "user:edit": EditUserDialog,
      "user:delete": DeleteUserDialog,
    },
    initializeCommon: true, // Initialize confirmation & alert dialogs
  });

  // Register lazy-loaded dialogs (loaded on-demand)
  // These are only loaded when first opened
  dialogRegistry.registerLazy(
    "user:bulk-import",
    createLazyDialogLoader(() => import("./components/BulkImportDialog"))
  );

  dialogRegistry.registerLazy(
    "user:advanced-settings",
    createLazyDialogLoader(() => import("./components/AdvancedSettingsDialog"))
  );

  dialogRegistry.registerLazy(
    "user:export",
    createLazyDialogLoader(() => import("./components/ExportDialog"))
  );
}
```

**2. Initialization Component:**

```tsx
// apps/user/src/dialogs/initialize.tsx
"use client";

import { useEffect } from "react";
import { setupUserDialogs } from "./setup";

export function InitializeDialogs() {
  useEffect(() => {
    setupUserDialogs();
  }, []);

  return null;
}
```

**3. App Providers:**

```tsx
// apps/user/src/components/providers/AppProviders.tsx
"use client";

import { DialogProvider } from "@buildbase/dialog-manager/provider";
import { ThemeProvider } from "@buildbase/ui/components/providers/ThemeProvider";
import { ReduxProvider } from "@buildbase/redux/provider";
import { TanStackQueryProvider } from "@buildbase/tanstack-query/provider";

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <ReduxProvider>
        <TanStackQueryProvider>
          <DialogProvider>{children}</DialogProvider>
        </TanStackQueryProvider>
      </ReduxProvider>
    </ThemeProvider>
  );
}
```

**4. Root Layout:**

```tsx
// apps/user/src/app/layout.tsx
import { AppProviders } from "@/components/providers/AppProviders";
import { InitializeDialogs } from "@/dialogs/initialize";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AppProviders>
          <InitializeDialogs />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
```

**Key Points:**

- `DialogProvider` is added to `AppProviders` (wraps all app content)
- `InitializeDialogs` component calls setup once on client-side mount
- Eager load dialogs used in main user flows (create, edit, delete, view)
- Lazy load secondary features (bulk operations, exports, advanced settings)
- All lazy-loaded dialogs are automatically loaded when first opened
- No manual preloading needed in most cases

## Benefits of This Architecture

1. **Performance**: Dialogs are only loaded when needed
2. **Code Splitting**: Automatic code splitting for lazy-loaded dialogs
3. **Type Safety**: Full TypeScript support with inferred types
4. **Maintainability**: Clear separation of concerns
5. **Scalability**: Easy to add new dialogs without bloating the bundle
6. **Flexibility**: Mix of eager and lazy loading based on needs

## Standard App Structure

Every app should follow this structure:

```
apps/{app}/src/
├── components/
│   └── providers/
│       └── AppProviders.tsx      # ✅ DialogProvider included
├── dialogs/
│   ├── setup.ts                  # ✅ Dialog registration
│   ├── initialize.tsx            # ✅ Client initialization
│   ├── index.ts                  # ✅ Barrel exports
│   ├── components/               # ✅ Dialog components
│   │   └── .gitkeep
│   └── README.md                 # ✅ App-specific docs
└── app/
    └── layout.tsx                # ✅ InitializeDialogs added
```

## Migration Guide

If you have existing dialogs:

1. **Add DialogProvider** to your `AppProviders.tsx`:

   ```tsx
   import { DialogProvider } from "@buildbase/dialog-manager/provider";

   <DialogProvider>{children}</DialogProvider>;
   ```

2. **Create dialog setup structure**:
   - Create `src/dialogs/setup.ts`
   - Create `src/dialogs/initialize.tsx`
   - Create `src/dialogs/components/` directory

3. **Register your dialogs** in `setup.ts`:

   ```tsx
   export function setupUserDialogs() {
     setupAppDialogs({
       dialogs: {
         "user:create": CreateUserDialog, // Eager load
       },
     });
   }
   ```

4. **Add InitializeDialogs** to your root layout:

   ```tsx
   import { InitializeDialogs } from "@/dialogs/initialize";

   <AppProviders>
     <InitializeDialogs />
     {children}
   </AppProviders>;
   ```

5. **Convert heavy dialogs to lazy loading**:

   ```tsx
   // Before: Eager load
   setupAppDialogs({
     dialogs: {
       "heavy-dialog": HeavyDialog,
     },
   });

   // After: Lazy load
   dialogRegistry.registerLazy(
     "heavy-dialog",
     createLazyDialogLoader(() => import("./components/HeavyDialog"))
   );
   ```
