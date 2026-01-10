# Environment Variable Management

This monorepo uses **`@t3-oss/env-nextjs`** for centralized, type-safe environment variable management. All environment variables are stored in a single root `.env` file and shared across all apps.

## 📁 File Structure

```
nextjs-starter-turborepo/
├── .env                    # Main env file (git-ignored, create from .env.example)
├── .env.example            # Template with all env vars (committed to git)
├── .env.local              # Local overrides (git-ignored, optional)
└── packages/env/           # Env validation package
    ├── src/
    │   ├── schema.ts       # Zod schema for validation
    │   ├── index.ts        # Main exports
    │   ├── load-env.ts     # Loader for non-Next.js contexts
    │   └── validate.ts     # Validation script
    └── README.md
```

## 🚀 Quick Start

### 1. Create your `.env` file

```bash
cp .env.example .env
```

### 2. Fill in your values

Edit `.env` with your actual values (database URLs, API keys, etc.)

### 3. Validate (optional)

```bash
yarn workspace @buildbase/env validate
```

## 📖 How It Works

### For Next.js Apps

Next.js **automatically** loads `.env` files from the project root. Since all apps are in the monorepo, they all read from the root `.env` file.

**Usage in Next.js apps (Server-side):**

```ts
// In API routes, server components, server actions
import { env } from "@buildbase/env";

// Type-safe access to server-only variables
const dbUrl = env.DATABASE_URL;
const apiSecret = env.API_SECRET;
```

**Usage in Next.js apps (Client-side):**

```ts
// In client components (must use NEXT_PUBLIC_* variables)
"use client";
import { env } from "@buildbase/env";

// Client-accessible variables
const appUrl = env.NEXT_PUBLIC_PUBLIC_APP_URL;
const apiUrl = `${appUrl}/api`;
```

### Server vs Client Variables

- **Server variables**: Only available in API routes, server components, server actions
- **Client variables**: Must be prefixed with `NEXT_PUBLIC_` and are exposed to the browser

### For Packages

Packages can use the same `env` import:

```ts
// In packages
import { env } from "@buildbase/env";

// Use validated env
const dbUrl = env.DATABASE_URL;
```

## 🔒 Environment Variable Priority

Next.js loads env files in this order (highest priority first):

1. **`.env.local`** - Local overrides (git-ignored)
2. **`.env.development`** / **`.env.production`** / **`.env.test`** - Environment-specific
3. **`.env`** - Default fallback

For this monorepo, we use:

- **`.env`** - Main shared env file (git-ignored)
- **`.env.local`** - Local machine overrides (git-ignored, optional)
- **`.env.example`** - Template (committed to git)

## ✏️ Adding New Environment Variables

### Step 1: Add to Schema

Edit `packages/env/src/schema.ts`:

```ts
export const envSchema = z.object({
  // ... existing vars
  NEW_VAR: z.string().min(1), // Required
  OPTIONAL_VAR: z.string().optional(), // Optional
});
```

### Step 2: Update `.env.example`

Add the new variable to `.env.example`:

```bash
NEW_VAR=default-value
OPTIONAL_VAR=optional-default
```

### Step 3: Add to Your `.env`

Add the actual value to your `.env` file.

### Step 4: Update Turbo (if needed)

If the variable should be tracked by Turbo for cache invalidation, add it to `turbo.json`:

```json
{
  "globalEnv": ["NODE_ENV", "NEW_VAR"]
}
```

## ✅ Validation

The `@buildbase/env` package uses **`@t3-oss/env-nextjs`** with **Zod** for runtime validation. This means:

- ✅ **Type safety** - TypeScript knows the shape of your env vars
- ✅ **Runtime validation** - Errors if required vars are missing
- ✅ **Type coercion** - Automatically converts strings to booleans, numbers, etc.
- ✅ **Next.js optimized** - Separate server/client variable handling
- ✅ **Automatic validation** - Validates on import, no manual loading needed

### Validate Manually

```bash
yarn workspace @buildbase/env validate
```

### Validation Errors

If validation fails, you'll see clear error messages:

```
❌ Environment variable validation failed:
Required: DATABASE_URL
```

## 🔐 Security Best Practices

1. **Never commit `.env` files** - They're in `.gitignore`
2. **Use `.env.example`** - Document all required variables
3. **Use `.env.local`** - For machine-specific overrides
4. **Validate in CI/CD** - Run `yarn workspace @buildbase/env validate` in your pipeline

## 📝 Example Usage

### In a Next.js API Route

```ts
// apps/public/app/api/users/route.ts
import { env } from "@buildbase/env";

export async function GET() {
  const dbUrl = env.DATABASE_URL;
  // Use dbUrl...
}
```

### In a Package

```ts
// packages/api-helpers/src/users.ts
import { loadEnv } from "@buildbase/env/load-env";
import { env } from "@buildbase/env";

loadEnv(); // Load env vars

export const getAllUsers = async () => {
  const dbUrl = env.DATABASE_URL;
  // Use dbUrl...
};
```

### In a Script

```ts
// scripts/migrate.ts
import { loadEnv } from "@buildbase/env/load-env";
import { env } from "@buildbase/env";

loadEnv();

console.log(`Connecting to: ${env.DATABASE_URL}`);
```

## 🎯 Benefits

1. **Single Source of Truth** - One `.env` file for all apps
2. **Type Safety** - TypeScript knows your env vars
3. **Validation** - Catch missing vars early
4. **Consistency** - All apps use the same env vars
5. **Easy Management** - Update once, use everywhere

## 🔧 Troubleshooting

### "Required environment variable missing"

Run validation to see which vars are missing:

```bash
yarn workspace @buildbase/env validate
```

### "Env vars not loading in package"

Make sure you call `loadEnv()` before using `env`:

```ts
import { loadEnv } from "@buildbase/env/load-env";
loadEnv(); // Don't forget this!
```

### "Next.js not reading env vars"

Next.js only loads `.env` files from the **project root**. Make sure your `.env` is in the monorepo root, not in individual app directories.
