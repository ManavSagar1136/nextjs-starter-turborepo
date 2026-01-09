# @repo/helpers

React hooks and context providers package. Contains custom React hooks and context providers for app-specific logic.

## Usage

```tsx
import { useLocalStorage } from "@repo/helpers/hooks/use-local-storage";
import { useDebounce } from "@repo/helpers/hooks/use-debounce";

function MyComponent() {
  const [value, setValue] = useLocalStorage("key", "default");
  const debouncedValue = useDebounce(value, 500);
  // ...
}
```

## Structure

- `src/hooks/use-local-storage.ts` - Local storage hook
- `src/hooks/use-debounce.ts` - Debounce hook
- `src/contexts/` - Context providers (add individual context files here)
