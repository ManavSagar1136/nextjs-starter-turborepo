# BuildBase NextJS Starter Turborepo

A production-ready Turborepo monorepo for building CMS applications with 4 Next.js apps and a comprehensive suite of shared packages.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Apps](#apps)
- [Packages](#packages)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)

## Overview

This monorepo provides a complete foundation for building multi-tenant CMS applications with:

- **4 Next.js applications** for different user experiences
- **19 shared packages** for maximum code reuse
- **Type-safe** end-to-end with TypeScript
- **Modern tooling** with Turborepo, ESLint, and Prettier

## Getting Started

### Prerequisites

- Node.js >= 20.9.0
- Yarn 1.22.22

### Setup

1. **Clone and install dependencies:**

   ```bash
   git clone https://github.com/buildbase-app/nextjs-starter-turborepo.git
   cd nextjs-starter-turborepo
   yarn install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Set up the database:**

   ```bash
   cd packages/database
   yarn db:generate
   yarn db:push
   ```

4. **Start development servers:**
   ```bash
   yarn dev
   ```

All four apps will start on their respective ports (see [Apps](#apps) below).

---

## Apps

### `apps/public` - Public Website

**Port:** 3100 | **Package:** `public`

The public-facing website for showcasing features, landing pages, and marketing content.

**Use cases:**

- Landing pages and marketing content
- Public documentation and feature showcases
- SEO-optimized pages for discovery

### `apps/user` - User Application

**Port:** 3101 | **Package:** `user`

The main user-facing application where authenticated users interact with the CMS.

**Use cases:**

- User dashboard and workspace management
- Content creation and editing
- User settings and preferences

### `apps/admin` - Admin Panel

**Port:** 3102 | **Package:** `admin`

Administrative interface for managing users, content, and system settings.

**Use cases:**

- User and workspace administration
- Content moderation and management
- System configuration and monitoring
- Analytics and reporting

### `apps/docs` - Documentation

**Port:** 3103 | **Package:** `docs`

Documentation site with tutorials, API references, and guides.

**Use cases:**

- API documentation
- User guides and tutorials
- Developer documentation

---

## Packages

### UI & Components

#### `@buildbase/ui` - Base UI Components

shadcn/ui component library providing the foundational UI primitives.

```tsx
import { Button } from "@buildbase/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@buildbase/ui/dialog";
import { Input } from "@buildbase/ui/input";

<Button variant="default" size="lg">
  Click me
</Button>;
```

#### `@buildbase/magicui` - Animated Components

Magic UI animated components for enhanced visual experiences.

```tsx
import { AnimatedComponent } from "@buildbase/magicui/animated-component";

<AnimatedComponent animation="fadeIn">{/* content */}</AnimatedComponent>;
```

#### `@buildbase/components` - Business Components

Custom business components built on top of `@buildbase/ui` and `@buildbase/magicui`.

```tsx
import { CustomComponent } from "@buildbase/components/components/custom-component";
```

---

### Data & State Management

#### `@buildbase/database` - Prisma Database

Shared Prisma schema and client with multi-file schema support (Prisma 6.7.0+).

```ts
import { prisma } from "@buildbase/database";

const users = await prisma.user.findMany();
const workspace = await prisma.workspace.create({
  data: { name: "My Workspace" },
});
```

**Schema Structure:**

- `prisma/schema/schema.prisma` - Generator and datasource config
- `prisma/schema/user.prisma` - User model
- `prisma/schema/workspace.prisma` - Workspace model
- Additional models in separate files

**Commands:**

```bash
yarn db:generate  # Generate Prisma client
yarn db:push      # Push schema to database
yarn db:migrate   # Run migrations
```

#### `@buildbase/tanstack-query` - Data Fetching

TanStack Query (React Query) setup with pre-configured client and typed hooks. **All TanStack Query hooks are re-exported from this package.**

```tsx
// Setup in layout
import { TanStackQueryProvider } from "@buildbase/tanstack-query/provider";

<TanStackQueryProvider>{children}</TanStackQueryProvider>;

// Usage in components
import { useQuery, useMutation, useQueryClient } from "@buildbase/tanstack-query";

const { data, isLoading } = useQuery({
  queryKey: ["users"],
  queryFn: fetchUsers,
});

const mutation = useMutation({
  mutationFn: createUser,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
});
```

#### `@buildbase/redux` - State Management

Redux Toolkit setup with persistence and typed hooks.

```tsx
// Setup in layout
import { ReduxProvider } from "@buildbase/redux/provider";

<ReduxProvider
  additionalReducers={{ user: userReducer }}
  persistConfig={{ key: "app", whitelist: ["counter", "user"] }}
>
  {children}
</ReduxProvider>;

// Usage in components
import { useAppDispatch, useAppSelector } from "@buildbase/redux/hooks";
import { increment } from "@buildbase/redux/slices/counter";

const count = useAppSelector(state => state.counter.value);
const dispatch = useAppDispatch();
dispatch(increment());
```

#### `@buildbase/cache` - Redis Caching

Upstash Redis caching with rate limiting, fallback cache, and multiple strategies.

```ts
import { defaultCacheService } from "@buildbase/cache/factory";
import { generateCacheKey } from "@buildbase/cache/config";

// Set with strategy
await defaultCacheService.set(generateCacheKey.user("123", "profile"), data, {
  strategy: "user", // 30 min TTL
});

// Get with cache wrapper
const data = await defaultCacheService.withCache(
  "expensive-operation",
  async () => fetchExpensiveData(),
  { strategy: "api", ttl: 600 }
);

// Rate limiting
import { defaultRateLimiter, RATE_LIMIT_CONFIGS } from "@buildbase/cache/factory";

const result = await defaultRateLimiter.checkRateLimit(
  "user:123",
  RATE_LIMIT_CONFIGS.API
);
```

**Cache Strategies:**

- `static` - Long TTL (1 hour) for app config
- `dynamic` - Medium TTL (5 min) for changing content
- `user` - Medium TTL (30 min) for user-specific data
- `api` - Short TTL (10 min) for API responses

---

### API & Networking

#### `@buildbase/api-helpers` - Database Utilities

Database operation utilities and API middleware.

```ts
import { getUserById, createUser } from "@buildbase/api-helpers/users";
import { prisma } from "@buildbase/api-helpers/prisma";

const user = await getUserById("user-id");
```

**Cron Protection Middleware:**

```ts
import { withCronCheck } from "@buildbase/api-helpers/middleware/with-cron-check";

const handler = async req => {
  await runDailyTask();
  return NextResponse.json({ success: true });
};

export const GET = withCronCheck(handler);
```

#### `@buildbase/http-client` - HTTP Client

HTTP client with encryption support, pagination, and error handling.

```ts
import { ApiController } from "@buildbase/http-client/controller";
import { ApiPaginationController } from "@buildbase/http-client/pagination";

class UsersController extends ApiController {
  protected urlPath = "/users";

  constructor() {
    super({ serverUrl: "http://localhost:3000/api" });
  }

  async getUser(id: string) {
    return (await this.get(`/${id}`, {}, {})).data;
  }
}
```

#### `@buildbase/qstash` - Serverless Messaging

Upstash QStash for message queuing, scheduling, and webhooks.

```ts
import { defaultQStashClient } from "@buildbase/qstash/factory";

// Publish message
await defaultQStashClient.publishJSON({
  url: "https://app.com/api/webhook",
  body: { event: "user.created", userId: "123" },
  delay: "5m",
});

// Schedule recurring task
await defaultQStashClient.schedule({
  destination: "https://app.com/api/cron/daily",
  cron: "0 9 * * *",
  body: { reportType: "daily" },
});

// Webhook verification
import { withQStashWebhook } from "@buildbase/qstash/middleware";

export const POST = withQStashWebhook(async req => {
  const body = await req.json();
  await processWebhook(body);
  return NextResponse.json({ success: true });
});
```

---

### Hooks & Utilities

#### `@buildbase/hooks-manager` - Common Hooks

Centralized React hooks for common operations.

```tsx
import { useToggle } from "@buildbase/hooks-manager/hooks/use-toggle";
import { useMediaQuery } from "@buildbase/hooks-manager/hooks/use-media-query";
import { useClickOutside } from "@buildbase/hooks-manager/hooks/use-click-outside";
import { useWindowSize } from "@buildbase/hooks-manager/hooks/use-window-size";

const [isOpen, { toggle, setTrue, setFalse }] = useToggle();
const isMobile = useMediaQuery("(max-width: 768px)");
const { width, height } = useWindowSize();
```

#### `@buildbase/helpers` - React Helpers

React hooks and context providers for app-specific logic.

```tsx
import { useLocalStorage } from "@buildbase/helpers/hooks/use-local-storage";
import { useDebounce } from "@buildbase/helpers/hooks/use-debounce";

const [value, setValue] = useLocalStorage("key", "default");
const debouncedValue = useDebounce(value, 500);
```

#### `@buildbase/utils` - Pure Utilities

Pure utility functions with no React dependencies.

```ts
import { formatDate, formatCurrency } from "@buildbase/utils/format";
import { isValidEmail } from "@buildbase/utils/validation";

formatDate(new Date()); // "Jan 27, 2026"
formatCurrency(99.99); // "$99.99"
isValidEmail("user@example.com"); // true
```

---

### UI Management

#### `@buildbase/dialog-manager` - Dialog System

Centralized, type-safe dialog management with registry pattern.

```tsx
// Setup
import { initializeCommonDialogs } from "@buildbase/dialog-manager";
import { DialogProvider } from "@buildbase/dialog-manager/provider";

initializeCommonDialogs();

<DialogProvider>{children}</DialogProvider>;

// Usage
import { useDialogManager, COMMON_DIALOG_KEYS } from "@buildbase/dialog-manager";

const { openDialog } = useDialogManager();

openDialog(COMMON_DIALOG_KEYS.CONFIRMATION, {
  variant: "delete",
  title: "Delete Item?",
  description: "This action cannot be undone.",
  confirmButtonProps: {
    onAction: async () => {
      await deleteItem();
      return { success: true };
    },
  },
});
```

**Register Custom Dialogs:**

```tsx
import { setupAppDialogs } from "@buildbase/dialog-manager/app-setup";

setupAppDialogs({
  dialogs: {
    "user:create": CreateUserDialog,
    "user:edit": EditUserDialog,
  },
  initializeCommon: true,
});
```

---

### Configuration

#### `@buildbase/env` - Environment Variables

Type-safe, validated environment variables using `@t3-oss/env-nextjs`.

```ts
import { env, isDevelopment, isProduction } from "@buildbase/env";

// Server-side (API routes, Server Components)
const dbUrl = env.DATABASE_URL;
const apiSecret = env.API_SECRET;

// Client-side (must be NEXT_PUBLIC_*)
const appUrl = env.NEXT_PUBLIC_PUBLIC_APP_URL;

if (isDevelopment()) {
  // Development-only code
}
```

**Adding New Variables:**

1. Add to `packages/env/src/schema.ts`
2. Update `.env.example`
3. Add to your `.env` file

#### `@buildbase/tailwind-config` - Tailwind Configuration

Shared Tailwind CSS configuration for consistent styling.

```js
// tailwind.config.js
import sharedConfig from "@buildbase/tailwind-config";

export default {
  ...sharedConfig,
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
};
```

#### `@buildbase/eslint-config` - ESLint Configuration

Shared ESLint configurations for consistent code quality.

```js
// .eslintrc.js
module.exports = {
  extends: ["@buildbase/eslint-config/next"],
};
```

#### `@buildbase/typescript-config` - TypeScript Configuration

Shared TypeScript configurations.

```json
// tsconfig.json
{
  "extends": "@buildbase/typescript-config/nextjs.json"
}
```

---

### Authentication & SaaS

#### `@buildbase/saas-sdk` - SaaS SDK Provider

Reusable SaaS SDK provider for authentication and workspace management.

```tsx
import { SaaSProvider } from "@buildbase/saas-sdk";

<SaaSProvider
  redirectUrl={`${baseUrl}/auth/callback`}
  onSignOut={async () => {
    await API.auth.logout();
    window.location.reload();
  }}
  handleAuthentication={async code => {
    const data = await API.auth.verify(code);
    return { sessionId: data.sessionId };
  }}
  handleEvent={(eventType, data) => {
    // Handle workspace events
  }}
>
  {children}
</SaaSProvider>;
```

**Token Verification:**

```ts
import { verifySDKToken } from "@buildbase/saas-sdk/token-verification";

const result = await verifySDKToken({ code: "auth-code" });
if (result.success) {
  console.log("User:", result.user);
}
```

---

## Environment Variables

Environment variables are managed centrally in the root `.env` file and shared across all apps.

### Setup

1. Copy `.env.example` to `.env`
2. Fill in your values
3. All apps will automatically use these variables

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://..."

# Redis (for caching)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# QStash (for messaging)
QSTASH_TOKEN="..."
QSTASH_CURRENT_SIGNING_KEY="..."

# App URLs
NEXT_PUBLIC_PUBLIC_APP_URL="http://localhost:3100"
NEXT_PUBLIC_USER_APP_URL="http://localhost:3101"
NEXT_PUBLIC_ADMIN_APP_URL="http://localhost:3102"
NEXT_PUBLIC_DOCS_APP_URL="http://localhost:3103"
```

### Validation

```bash
yarn workspace @buildbase/env validate
```

See `packages/env/README.md` and `ENV_MANAGEMENT.md` for more details.

---

## Scripts

| Command            | Description                            |
| ------------------ | -------------------------------------- |
| `yarn dev`         | Start all apps in development mode     |
| `yarn build`       | Build all packages and apps            |
| `yarn lint`        | Lint all packages and apps             |
| `yarn check-types` | Type check all packages and apps       |
| `yarn format`      | Format code with Prettier              |
| `yarn db:generate` | Generate Prisma client                 |
| `yarn db:push`     | Push schema to database                |
| `yarn db:migrate`  | Run database migrations                |
| `yarn db:studio`   | Open Prisma Studio                     |
| `yarn ralph`       | Run Ralph autonomous agent (see below) |

---

## Ralph - Autonomous AI Agent

Ralph is an autonomous AI coding agent that implements PRD items one by one until all tasks are complete.

### Quick Start

1. **Edit your PRD:**

   ```bash
   # Modify scripts/ralph/prd.json with your user stories
   ```

2. **Run Ralph:**

   ```bash
   yarn ralph              # Default: Claude Code, 10 iterations
   yarn ralph 20           # 20 iterations
   yarn ralph:amp          # Use Amp instead
   ```

3. **Check progress:**
   - `scripts/ralph/prd.json` - Story completion status
   - `scripts/ralph/progress.txt` - Learnings and patterns

See [scripts/ralph/README.md](scripts/ralph/README.md) for full documentation.

---

## Tech Stack

| Category            | Technology          |
| ------------------- | ------------------- |
| **Framework**       | Next.js 16          |
| **Language**        | TypeScript          |
| **Styling**         | Tailwind CSS        |
| **UI Components**   | shadcn/ui, Magic UI |
| **Database**        | Prisma              |
| **Data Fetching**   | TanStack Query      |
| **State**           | Redux Toolkit       |
| **Caching**         | Upstash Redis       |
| **Messaging**       | Upstash QStash      |
| **Monorepo**        | Turborepo           |
| **Package Manager** | Yarn Workspaces     |

---

## Architecture

```
nextjs-starter-turborepo/
├── apps/
│   ├── public/          # Public website (port 3100)
│   ├── user/            # User application (port 3101)
│   ├── admin/           # Admin panel (port 3102)
│   └── docs/            # Documentation (port 3103)
├── packages/
│   ├── ui/              # Base UI components (shadcn/ui)
│   ├── magicui/         # Animated components
│   ├── components/      # Business components
│   ├── database/        # Prisma schema and client
│   ├── api-helpers/     # Database utilities
│   ├── tanstack-query/  # TanStack Query setup
│   ├── redux/           # Redux Toolkit setup
│   ├── cache/           # Redis caching
│   ├── qstash/          # Serverless messaging
│   ├── http-client/     # HTTP client
│   ├── hooks-manager/   # Common React hooks
│   ├── helpers/         # React helpers
│   ├── utils/           # Pure utilities
│   ├── dialog-manager/  # Dialog system
│   ├── env/             # Environment variables
│   ├── tailwind-config/ # Tailwind configuration
│   ├── eslint-config/   # ESLint configuration
│   ├── typescript-config/# TypeScript configuration
│   └── sass-sdk/        # SaaS SDK provider
├── .env.example         # Environment template
├── turbo.json           # Turborepo configuration
└── package.json         # Root package.json
```

---

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Run `yarn lint && yarn check-types` to ensure quality
4. Commit your changes
5. Push and create a pull request

---

## License

MIT
