# @repo/hooks-manager

Centralized hooks management package. Provides common React hooks and utilities for managing hooks across the monorepo.

## Usage

```tsx
import { useToggle } from "@repo/hooks-manager/hooks/use-toggle";
import { useMediaQuery } from "@repo/hooks-manager/hooks/use-media-query";
import { useClickOutside } from "@repo/hooks-manager/hooks/use-click-outside";
import { useWindowSize } from "@repo/hooks-manager/hooks/use-window-size";

function MyComponent() {
  const [isOpen, { toggle, setTrue, setFalse }] = useToggle();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { width, height } = useWindowSize();

  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setFalse());

  // ...
}
```

## Available Hooks

- `useToggle` - Boolean state with toggle, setTrue, setFalse actions
- `useMediaQuery` - Media query matching
- `useClickOutside` - Detect clicks outside an element
- `useWindowSize` - Track window dimensions
