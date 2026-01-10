# @buildbase/redux

Shared Redux Toolkit setup for all apps in the monorepo. Provides a configured Redux store with persistence, typed hooks, and example slices.

## Features

- ✅ **Redux Toolkit** - Modern Redux with best practices
- ✅ **Redux Persist** - Automatic state persistence to localStorage
- ✅ **TypeScript** - Fully typed with TypeScript
- ✅ **SSR Safe** - Works with Next.js server-side rendering
- ✅ **Extensible** - Apps can add their own slices and reducers
- ✅ **Typed Hooks** - Pre-configured typed hooks for useDispatch and useSelector

## Installation

This package is already included in the monorepo. No additional installation needed.

## Usage

### Basic Usage (Default Store)

```tsx
// apps/user/src/app/layout.tsx
import { ReduxProvider } from "@buildbase/redux/provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
```

### Using Typed Hooks

```tsx
// apps/user/src/components/Counter.tsx
"use client";

import { useAppDispatch, useAppSelector } from "@buildbase/redux/hooks";
import { increment, decrement, reset } from "@buildbase/redux/slices/counter";

export function Counter() {
  const count = useAppSelector(state => state.counter.value);
  const dispatch = useAppDispatch();

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => dispatch(increment())}>Increment</button>
      <button onClick={() => dispatch(decrement())}>Decrement</button>
      <button onClick={() => dispatch(reset())}>Reset</button>
    </div>
  );
}
```

### Advanced Usage (Custom Reducers)

```tsx
// apps/user/src/app/layout.tsx
import { ReduxProvider } from "@buildbase/redux/provider";
import { userReducer } from "@/store/slices/userSlice";
import { cartReducer } from "@/store/slices/cartSlice";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <ReduxProvider
          additionalReducers={{
            user: userReducer,
            cart: cartReducer,
          }}
          persistConfig={{
            key: "user-app",
            whitelist: ["counter", "user", "cart"],
          }}
        >
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}
```

## Exports

- `@buildbase/redux/provider` - ReduxProvider component
- `@buildbase/redux/hooks` - Typed hooks (useAppDispatch, useAppSelector, useAppStore)
- `@buildbase/redux/store` - Store configuration and types
- `@buildbase/redux/storage` - Storage utility for SSR
- `@buildbase/redux/slices/counter` - Example counter slice

## Creating Custom Slices

Create your own slices in your app:

```tsx
// apps/user/src/store/slices/userSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserState {
  name: string;
  email: string;
}

const initialState: UserState = {
  name: "",
  email: "",
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserState>) => {
      state.name = action.payload.name;
      state.email = action.payload.email;
    },
    clearUser: state => {
      state.name = "";
      state.email = "";
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
```

Then add it to your ReduxProvider:

```tsx
<ReduxProvider additionalReducers={{ user: userReducer }}>
  {children}
</ReduxProvider>
```

## Types

```tsx
import type { RootState, AppDispatch, AppStore } from "@buildbase/redux/store";
```
