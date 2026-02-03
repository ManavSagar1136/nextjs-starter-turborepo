# React Native Integration Architecture

> **Branch:** `feat/react-native-support`  
> **Status:** Planning Phase  
> **Author:** MONA  
> **Date:** 2026-02-03

---

## Executive Summary

This document outlines the architecture for adding React Native support to the CMS monorepo while maximizing code sharing between web (Next.js) and mobile platforms.

---

## Current Monorepo Structure

```
nextjs-starter-turborepo/
├── apps/
│   ├── admin/          # Next.js 16 - Admin panel
│   ├── docs/           # Next.js - Documentation
│   ├── public/         # Next.js - Public site
│   └── user/           # Next.js 16 - User dashboard
├── packages/
│   ├── api-helpers/    # API utilities
│   ├── cache/          # Upstash Redis caching
│   ├── components/     # Shared React components (web)
│   ├── database/       # Prisma client & queries
│   ├── dialog-manager/ # Dialog/modal system (web)
│   ├── email/          # Email providers
│   ├── env/            # Environment validation (T3)
│   ├── eslint-config/  # Shared ESLint config
│   ├── helpers/        # Business logic helpers
│   ├── hooks-manager/  # React hooks (mostly web)
│   ├── http-client/    # Axios-based HTTP client
│   ├── logger/         # Pino logging
│   ├── magicui/        # Animation components (web)
│   ├── qstash/         # Upstash QStash
│   ├── redux/          # Redux Toolkit + Persist
│   ├── sass-sdk/       # SaaS SDK integration
│   ├── storage/        # Cloud storage (S3/GCS)
│   ├── tailwind-config/# Tailwind presets
│   ├── tanstack-query/ # React Query setup
│   ├── testing/        # Test utilities
│   ├── typescript-config/ # TS presets
│   ├── ui/             # UI components (Radix-based)
│   └── utils/          # Pure utility functions
└── turbo.json
```

---

## Package Compatibility Analysis

### ✅ Fully Compatible (Share As-Is)

| Package                  | Notes                                                |
| ------------------------ | ---------------------------------------------------- |
| `@buildbase/utils`             | Pure TS functions (formatDate, validation, etc.)     |
| `@buildbase/redux`             | Redux Toolkit + redux-persist (swap storage adapter) |
| `@buildbase/tanstack-query`    | React Query works natively                           |
| `@buildbase/typescript-config` | Config only                                          |
| `@buildbase/eslint-config`     | Config only (add RN plugin)                          |
| `@buildbase/logger`            | Pino works in RN with polyfills                      |

### ⚠️ Requires Adaptation

| Package              | Issue                     | Solution                                          |
| -------------------- | ------------------------- | ------------------------------------------------- |
| `@buildbase/http-client`   | Uses Node `https` module  | Create platform abstraction or use fetch          |
| `@buildbase/env`           | Uses `@t3-oss/env-nextjs` | Create `@buildbase/env-native` with react-native-dotenv |
| `@buildbase/helpers`       | Some server-only code     | Split into `/client` and `/server` exports        |
| `@buildbase/hooks-manager` | 3/4 hooks are web-only    | Create RN equivalents (Dimensions, etc.)          |
| `@buildbase/storage`       | Server-side only          | N/A for mobile (use via API)                      |

### ❌ Web Only (Need Native Alternatives)

| Package                | Why                  | Alternative                     |
| ---------------------- | -------------------- | ------------------------------- |
| `@buildbase/ui`              | Radix UI (DOM-based) | Create `@buildbase/ui-native`         |
| `@buildbase/components`      | DOM + framer-motion  | Create `@buildbase/components-native` |
| `@buildbase/dialog-manager`  | Radix dialogs        | Create native dialog system     |
| `@buildbase/magicui`         | DOM animations       | Use react-native-reanimated     |
| `@buildbase/tailwind-config` | CSS-based            | Use NativeWind                  |
| `@buildbase/database`        | Prisma (server)      | Access via API only             |
| `@buildbase/cache`           | Redis (server)       | Access via API                  |
| `@buildbase/email`           | Server-side          | N/A                             |
| `@buildbase/qstash`          | Server-side          | N/A                             |

---

## Proposed Architecture

### New Directory Structure

```
nextjs-starter-turborepo/
├── apps/
│   ├── admin/
│   ├── docs/
│   ├── public/
│   ├── user/
│   └── mobile/                    # NEW: React Native app
│       ├── app/                   # Expo Router screens
│       ├── components/            # App-specific components
│       ├── metro.config.js
│       ├── app.json
│       └── package.json
├── packages/
│   ├── ... (existing)
│   ├── ui-native/                 # NEW: RN UI components
│   ├── components-native/         # NEW: RN feature components
│   ├── env-native/                # NEW: RN env handling
│   ├── hooks-native/              # NEW: RN-specific hooks
│   └── shared/                    # NEW: Platform-agnostic logic
│       ├── api/                   # API types & contracts
│       ├── constants/             # Shared constants
│       ├── types/                 # Shared TypeScript types
│       └── validation/            # Zod schemas
```

### Package Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                        SHARED LAYER                              │
│  @buildbase/utils  @buildbase/redux  @buildbase/tanstack-query  @buildbase/shared       │
│  (Pure TypeScript - works everywhere)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┴───────────────────┐
          ▼                                       ▼
┌─────────────────────────┐         ┌─────────────────────────┐
│      WEB LAYER          │         │     NATIVE LAYER        │
│  @buildbase/ui                │         │  @buildbase/ui-native         │
│  @buildbase/components        │         │  @buildbase/components-native │
│  @buildbase/hooks-manager     │         │  @buildbase/hooks-native      │
│  @buildbase/dialog-manager    │         │  @buildbase/dialog-native     │
│  @buildbase/env               │         │  @buildbase/env-native        │
│  @buildbase/tailwind-config   │         │  nativewind             │
└─────────────────────────┘         └─────────────────────────┘
          │                                       │
          ▼                                       ▼
┌─────────────────────────┐         ┌─────────────────────────┐
│      WEB APPS           │         │     MOBILE APP          │
│  apps/admin             │         │  apps/mobile            │
│  apps/user              │         │  (Expo Router)          │
│  apps/public            │         │                         │
│  apps/docs              │         │                         │
└─────────────────────────┘         └─────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Foundation (Week 1)

#### 1.1 Create `apps/mobile` with Expo

```bash
# Using Expo SDK 53 with Expo Router
cd apps
npx create-expo-app mobile --template tabs
```

**Package.json additions:**

```json
{
  "name": "mobile",
  "dependencies": {
    "@buildbase/utils": "*",
    "@buildbase/redux": "*",
    "@buildbase/tanstack-query": "*",
    "expo": "~53.0.0",
    "expo-router": "~4.0.0",
    "nativewind": "^4.0.0",
    "react-native-reanimated": "~3.16.0"
  }
}
```

#### 1.2 Configure Metro for Monorepo

```javascript
// apps/mobile/metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [monorepoRoot];

// Resolve packages from monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Ensure we resolve to single copies of React
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
```

#### 1.3 Update Root `turbo.json`

```json
{
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", ".expo/**"]
    },
    "ios": {
      "cache": false,
      "persistent": true
    },
    "android": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### Phase 2: Shared Package (Week 1-2)

#### 2.1 Create `@buildbase/shared`

Extract platform-agnostic code:

```typescript
// packages/shared/src/api/types.ts
export interface User {
  id: string;
  email: string;
  name: string;
  workspaceId: string;
}

export interface Asset {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
}

// packages/shared/src/api/endpoints.ts
export const API_ENDPOINTS = {
  auth: {
    login: "/api/auth/login",
    session: "/api/auth/session",
    logout: "/api/auth/logout",
  },
  assets: {
    list: "/api/assets",
    get: (id: string) => `/api/assets/${id}`,
    upload: "/api/assets/upload",
  },
} as const;

// packages/shared/src/validation/auth.ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

### Phase 3: Native UI Package (Week 2-3)

#### 3.1 Create `@buildbase/ui-native`

```typescript
// packages/ui-native/src/Button.tsx
import { Pressable, Text, StyleSheet } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'flex items-center justify-center rounded-md',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        secondary: 'bg-secondary',
        outline: 'border border-input bg-transparent',
        ghost: 'bg-transparent',
        destructive: 'bg-destructive',
      },
      size: {
        sm: 'h-9 px-3',
        md: 'h-10 px-4',
        lg: 'h-11 px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  onPress: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export function Button({ variant, size, onPress, children, disabled }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={buttonVariants({ variant, size })}
    >
      <Text className="text-primary-foreground font-medium">
        {children}
      </Text>
    </Pressable>
  );
}
```

#### 3.2 NativeWind Configuration

```javascript
// apps/mobile/tailwind.config.js
const sharedConfig = require("@buildbase/tailwind-config");

module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "../../packages/ui-native/src/**/*.{js,jsx,ts,tsx}",
    "../../packages/components-native/src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Inherit colors from shared config
      colors: sharedConfig.theme?.extend?.colors || {},
    },
  },
};
```

### Phase 4: Redux & State (Week 2)

#### 4.1 Update `@buildbase/redux` for Cross-Platform

```typescript
// packages/redux/src/store.ts
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer, Storage } from "redux-persist";

// Platform-agnostic store factory
export function createStore(storage: Storage) {
  const persistConfig = {
    key: "root",
    storage,
    whitelist: ["auth", "user"],
  };

  const rootReducer = combineReducers({
    auth: authReducer,
    user: userReducer,
    // ... other reducers
  });

  const persistedReducer = persistReducer(persistConfig, rootReducer);

  const store = configureStore({
    reducer: persistedReducer,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
        },
      }),
  });

  const persistor = persistStore(store);
  return { store, persistor };
}

// packages/redux/src/web.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createStore } from "./store";

// For web: use localStorage wrapper
const webStorage = {
  getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key: string, value: string) =>
    Promise.resolve(localStorage.setItem(key, value)),
  removeItem: (key: string) => Promise.resolve(localStorage.removeItem(key)),
};

export const { store, persistor } = createStore(webStorage);

// packages/redux/src/native.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createStore } from "./store";

export const { store, persistor } = createStore(AsyncStorage);
```

### Phase 5: HTTP Client Refactor (Week 2)

#### 5.1 Platform-Agnostic HTTP Client

```typescript
// packages/http-client/src/fetcher.ts
import CryptoJS from "crypto-js";

interface FetcherConfig {
  baseUrl: string;
  secretKey?: string;
  encryptData?: boolean;
}

export function createFetcher(config: FetcherConfig) {
  const { baseUrl, secretKey, encryptData = false } = config;

  async function request<T>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    endpoint: string,
    options?: {
      body?: unknown;
      headers?: Record<string, string>;
    }
  ): Promise<T> {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${baseUrl}${endpoint}`;

    let body = options?.body;
    if (body && encryptData && secretKey) {
      body = {
        v2: true,
        data: CryptoJS.AES.encrypt(JSON.stringify(body), secretKey).toString(),
      };
    }

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.v2 && secretKey) {
      const decrypted = CryptoJS.AES.decrypt(data.data, secretKey);
      return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
    }

    return data;
  }

  return {
    get: <T>(endpoint: string, headers?: Record<string, string>) =>
      request<T>("GET", endpoint, { headers }),
    post: <T>(
      endpoint: string,
      body: unknown,
      headers?: Record<string, string>
    ) => request<T>("POST", endpoint, { body, headers }),
    put: <T>(
      endpoint: string,
      body: unknown,
      headers?: Record<string, string>
    ) => request<T>("PUT", endpoint, { body, headers }),
    patch: <T>(
      endpoint: string,
      body: unknown,
      headers?: Record<string, string>
    ) => request<T>("PATCH", endpoint, { body, headers }),
    delete: <T>(endpoint: string, headers?: Record<string, string>) =>
      request<T>("DELETE", endpoint, { headers }),
  };
}
```

---

## Environment Variables Strategy

### Web (existing)

Uses `@t3-oss/env-nextjs` with build-time validation.

### Native (new)

```typescript
// packages/env-native/src/index.ts
import { z } from "zod";
import Constants from "expo-constants";

const envSchema = z.object({
  API_URL: z.string().url(),
  SAAS_ORG_ID: z.string(),
  SAAS_CLIENT_ID: z.string(),
});

// Expo uses app.config.js extra field
const rawEnv = Constants.expoConfig?.extra ?? {};

export const env = envSchema.parse(rawEnv);
```

```javascript
// apps/mobile/app.config.js
export default {
  expo: {
    name: "CMS Mobile",
    slug: "cms-mobile",
    extra: {
      API_URL: process.env.API_URL,
      SAAS_ORG_ID: process.env.SAAS_ORG_ID,
      SAAS_CLIENT_ID: process.env.SAAS_CLIENT_ID,
    },
  },
};
```

---

## Testing Strategy

### Shared Packages

- Continue using Vitest
- Tests run in Node environment

### Native App

- Use Jest with `jest-expo` preset
- Component tests with `@testing-library/react-native`
- E2E with Maestro or Detox

```json
// apps/mobile/package.json
{
  "scripts": {
    "test": "jest",
    "test:e2e": "maestro test"
  },
  "jest": {
    "preset": "jest-expo"
  }
}
```

---

## Migration Checklist

### Phase 1: Foundation

- [ ] Create `apps/mobile` with Expo
- [ ] Configure Metro for monorepo
- [ ] Update `turbo.json` with native tasks
- [ ] Verify `@buildbase/utils` works in RN
- [ ] Test `@buildbase/redux` with AsyncStorage

### Phase 2: Shared Package

- [ ] Create `packages/shared`
- [ ] Extract API types
- [ ] Extract Zod schemas
- [ ] Extract constants

### Phase 3: Native UI

- [ ] Create `packages/ui-native`
- [ ] Port Button, Input, Card components
- [ ] Setup NativeWind
- [ ] Create theme system

### Phase 4: State Management

- [ ] Update redux package for cross-platform
- [ ] Test tanstack-query in RN
- [ ] Create auth flow

### Phase 5: HTTP Client

- [ ] Refactor to use fetch
- [ ] Keep encryption logic
- [ ] Test file uploads in RN

### Phase 6: Feature Parity

- [ ] Auth screens
- [ ] Asset browser
- [ ] Upload flow
- [ ] Settings

---

## Risks & Mitigations

| Risk                        | Impact | Mitigation                                      |
| --------------------------- | ------ | ----------------------------------------------- |
| Metro symlink issues        | High   | Use Expo SDK 53+ with improved monorepo support |
| Duplicate React copies      | High   | Configure `resolver.disableHierarchicalLookup`  |
| Large bundle size           | Medium | Configure Metro to exclude unused packages      |
| Shared package drift        | Medium | Strict TypeScript + shared types                |
| Native module compatibility | Medium | Prefer Expo-compatible libraries                |

---

## Open Questions

1. **Auth strategy**: Use existing SaaS SDK or implement mobile-specific auth (biometrics, secure storage)?
2. **Offline support**: How much offline capability is needed?
3. **Push notifications**: Expo Push or FCM/APNs directly?
4. **Deep linking**: URL scheme design?

---

## Next Steps

1. ✅ Create this architecture document
2. ⏳ Review with team
3. ⏳ Create `apps/mobile` scaffold
4. ⏳ Set up Metro config
5. ⏳ Verify shared packages work

---

_Document will be updated as implementation progresses._
