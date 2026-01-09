# @buildbase/env

Centralized environment variable management for the monorepo using `@t3-oss/env-nextjs`. This package provides type-safe, validated environment variables with automatic Next.js integration.

## Features

- ✅ **Type-safe** - Full TypeScript support
- ✅ **Runtime validation** - Catches missing/invalid vars at startup
- ✅ **Next.js optimized** - Separate server/client variable handling
- ✅ **Monorepo friendly** - Single source of truth for all apps

## Setup

1. **Create a `.env` file in the root of the monorepo:**

```bash
cp .env.example .env
```

2. **Fill in your environment variables in `.env`**

3. **Validation happens automatically** when you import `env` - no manual validation needed!

## Usage

### In Next.js Apps (Server-side)

```ts
// apps/public/app/api/users/route.ts
import { env } from "@buildbase/env";

export async function GET() {
  // Server-only variables
  const dbUrl = env.DATABASE_URL;
  const apiSecret = env.API_SECRET;

  // Use env vars...
}
```

### In Next.js Apps (Client-side)

```ts
// apps/public/app/page.tsx
"use client";

import { env } from "@buildbase/env";

export default function Page() {
  // Client-accessible variables (NEXT_PUBLIC_*)
  const appUrl = env.NEXT_PUBLIC_APP_URL;
  const apiUrl = env.NEXT_PUBLIC_API_URL;

  return <div>App URL: {appUrl}</div>;
}
```

### In Server Components

```ts
// apps/public/app/layout.tsx
import { env, isDevelopment } from "@buildbase/env";

export default function Layout() {
  const isDev = isDevelopment();
  const dbUrl = env.DATABASE_URL; // Server-only

  return <html>...</html>;
}
```

### In Packages

```ts
// packages/api-helpers/src/users.ts
import { env } from "@buildbase/env";

export const getAllUsers = async () => {
  // Server variables work in packages (Node.js context)
  const dbUrl = env.DATABASE_URL;
  const apiUrl = env.API_URL;

  // Note: Client variables (NEXT_PUBLIC_*) are not available in packages
  // They're only available in Next.js apps

  // Use dbUrl...
};
```

**Important Notes for Packages:**

- ✅ **Server variables work** - All `server` variables are available in packages
- ❌ **Client variables don't work** - `NEXT_PUBLIC_*` variables are only available in Next.js apps
- ✅ **process.env is shared** - When packages are used by Next.js apps, they inherit the env vars
- ✅ **Works in Node.js scripts** - Can be used in standalone Node.js scripts too

## Server vs Client Variables

### Server Variables

- Only available in:
  - API routes (`app/api/**`)
  - Server Components
  - Server Actions
  - Middleware
- **Never exposed to the browser**
- Examples: `DATABASE_URL`, `API_SECRET`, `NEXTAUTH_SECRET`

### Client Variables

- Available in both server and client
- **Must be prefixed with `NEXT_PUBLIC_`**
- Exposed to the browser (visible in client-side code)
- Examples: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`

## Adding New Environment Variables

### Step 1: Add to Schema

Edit `packages/env/src/schema.ts`:

```ts
export const env = createEnv({
  server: {
    // ... existing vars
    NEW_SERVER_VAR: z.string().min(1), // Server-only
  },
  client: {
    // ... existing vars
    NEXT_PUBLIC_NEW_CLIENT_VAR: z.string().min(1), // Client-accessible
  },
  runtimeEnv: {
    // ... existing mappings
    NEW_SERVER_VAR: process.env.NEW_SERVER_VAR,
    NEXT_PUBLIC_NEW_CLIENT_VAR: process.env.NEXT_PUBLIC_NEW_CLIENT_VAR,
  },
});
```

### Step 2: Update `.env.example`

Add the new variable to `.env.example`:

```bash
NEW_SERVER_VAR=default-value
NEXT_PUBLIC_NEW_CLIENT_VAR=default-value
```

### Step 3: Add to Your `.env`

Add the actual value to your `.env` file.

## Validation

The package automatically validates environment variables when imported. If validation fails, you'll see clear error messages:

```
❌ Invalid environment variables: {
  DATABASE_URL: ["Required"]
}
```

### Skip Validation (Development)

To skip validation temporarily:

```bash
SKIP_ENV_VALIDATION=true yarn dev
```

**Note:** Validation happens automatically when you import `env` - if validation fails, you'll see clear error messages immediately.

## Type Safety

All environment variables are fully typed:

```ts
import { env } from "@buildbase/env";

// TypeScript knows the exact type
const dbUrl: string = env.DATABASE_URL;
const isDev: boolean = env.ENABLE_DEBUG;
```

## Helper Functions

```ts
import { isDevelopment, isProduction, isTest } from "@buildbase/env";

if (isDevelopment()) {
  // Development-only code
}
```

## Best Practices

1. **Never commit `.env` files** - They're git-ignored
2. **Use `.env.example`** - Document all required variables
3. **Prefix client vars** - Always use `NEXT_PUBLIC_` for client-accessible vars
4. **Keep secrets server-only** - Never expose sensitive data to the client
5. **Validation is automatic** - No need for manual validation scripts

## Troubleshooting

### "Invalid environment variables" error

The error message will show which variables are missing or invalid. Check your `.env` file and ensure all required variables are set.

### "Attempted to access invalid environment variable"

You're trying to access a server variable on the client. Make sure:

- Server variables are only used in server components/API routes
- Client-accessible variables are prefixed with `NEXT_PUBLIC_`

### Variables not loading

- Make sure `.env` is in the **monorepo root**, not in individual app directories
- Next.js automatically loads `.env` from the project root
- Restart your dev server after changing `.env`

## Resources

- [@t3-oss/env-nextjs Documentation](https://env.t3.gg/docs/nextjs)
- [Zod Documentation](https://zod.dev/)
