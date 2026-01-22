# Public App Dialogs

This directory contains all dialog components and setup for the public app.

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
// dialogs/components/ContactDialog.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@buildbase/ui/dialog";

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Your custom props
}

export default function ContactDialog({
  open,
  onOpenChange,
}: ContactDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contact Us</DialogTitle>
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
import ContactDialog from "./components/ContactDialog";

export function setupPublicDialogs() {
  setupAppDialogs({
    dialogs: {
      "public:contact": ContactDialog, // Eager load (frequently used)
    },
  });

  // Or lazy load for heavy/rarely-used dialogs:
  // dialogRegistry.registerLazy(
  //   "public:advanced-search",
  //   createLazyDialogLoader(() => import("./components/AdvancedSearchDialog"))
  // );
}
```

### 3. Export from Index (Optional)

```tsx
// dialogs/index.ts
export { default as ContactDialog } from "./components/ContactDialog";
```

### 4. Use the Dialog

```tsx
import { useDialogManager } from "@buildbase/dialog-manager";

function MyComponent() {
  const { openDialog } = useDialogManager();

  const handleContact = () => {
    openDialog("public:contact", {
      // props (excluding open and onOpenChange)
    });
  };

  return <button onClick={handleContact}>Contact Us</button>;
}
```

## Dialog Naming Convention

Use the pattern: `{app}:{action}` or `{feature}:{action}`

- ✅ `"public:contact"`
- ✅ `"public:newsletter"`
- ✅ `"public:subscribe"`
- ❌ `"contact"` (not namespaced)
- ❌ `"form"` (too generic)

## Eager vs Lazy Loading

**Eager Load** (in `setupAppDialogs`):
- Frequently used dialogs
- Small, simple dialogs
- Dialogs that need instant opening

**Lazy Load** (with `registerLazy`):
- Rarely used dialogs
- Heavy dialogs with large dependencies
- Secondary/advanced features
