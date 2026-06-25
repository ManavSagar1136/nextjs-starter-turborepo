# BuildBase Turborepo Starter

![Node.js](https://img.shields.io/badge/node-20.9+-brightgreen) ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![License](https://img.shields.io/badge/license-MIT-green)

A production-ready [Turborepo](https://turbo.build/) monorepo for building multi-tenant SaaS applications powered by [BuildBase](https://www.buildbase.app). Ships with 4 Next.js apps, 19 shared packages, and everything wired up — auth, billing, database, caching, messaging, and more.

> **Important:** This starter requires a [BuildBase](https://www.buildbase.app) account for authentication, workspace management, subscriptions, and billing. Without it the user app and admin panel will not function.

---

## Why use this?

- **4 apps out of the box** — public site, user dashboard, admin panel, and docs — all sharing the same packages
- **19 shared packages** — UI, database, caching, state, HTTP client, hooks, utilities, and more — zero duplication
- **BuildBase-powered** — auth, multi-tenancy, subscriptions, feature flags, and billing pre-wired
- **Production-hardened** — Redis caching, QStash messaging, Prisma ORM, type-safe env vars, ESLint, Prettier, Husky

---

## Table of Contents

- [Getting Started](#getting-started)
- [Apps](#apps)
- [Packages](#packages)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [License](#license)

---

## Getting Started

### Prerequisites

- Node.js >= 20.9.0
- Yarn 1.22.22
- MongoDB or PostgreSQL database
- [BuildBase](https://www.buildbase.app) account

### Setup

1. **Clone and install dependencies:**

   ```bash
   git clone https://github.com/buildbase-app/nextjs-starter-turborepo.git
   cd nextjs-starter-turborepo
   yarn install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.default .env
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

### `apps/public` — Public Website

**Port:** 3100

The public-facing marketing site for landing pages, feature showcases, and SEO content.

**Includes:**
- Landing pages and marketing content
- Public documentation and feature showcases
- SEO-optimized pages

### `apps/user` — User Application

**Port:** 3101

The main user-facing dashboard where authenticated users manage workspaces and content.

**Includes:**
- User dashboard and workspace management
- Content creation and editing
- User settings, billing, and preferences
- BuildBase auth integration

### `apps/admin` — Admin Panel

**Port:** 3102

Internal admin interface for managing users, content, and system configuration.

**Includes:**
- User and workspace administration
- Content moderation and management
- System configuration and monitoring
- Analytics and reporting

### `apps/docs` — Documentation

**Port:** 3103

Documentation site for API references, user guides, and developer docs.

---

## Packages

### UI & Components

#### `@buildbase/ui` — Base UI Components

shadcn/ui component library providing foundational UI primitives.

```tsx
import { Button } from "@buildbase/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@buildbase/ui/dialog";
import { Input } from "@buildbase/ui/input";

<Button variant="default" size="lg">Click me</Button>
```

#### `@buildbase/magicui` — Animated Components

Magic UI animated components for enhanced visual experiences.

```tsx
import { AnimatedComponent } from "@buildbase/magicui/animated-component";

<AnimatedComponent animation="fadeIn">{/* content */}</AnimatedComponent>
```

#### `@buildbase/components` — Business Components

Custom business components built on top of `@buildbase/ui` and `@buildbase/magicui`.

```tsx
import { CustomComponent } from "@buildbase/components/components/custom-component";
```

---

### Data & State Management

#### `@buildbase/database` — Prisma Database

Shared Prisma schema and client with multi-file schema support (Prisma 6.7.0+).

```ts
import { prisma } from "@buildbase/database";

const users = await prisma.user.findMany();
const workspace = await prisma.workspace.create({
  data: { name: "My Workspace" },
});
```

**Schema files:**
- `prisma/schema/schema.prisma` — Generator and datasource config
- `prisma/schema/user.prisma` — User model
- `prisma/schema/workspace.prisma` — Workspace model

**Commands:**
```bash
yarn db:generate   # Generate Prisma client
yarn db:push       # Push schema to database
yarn db:migrate    # Run migrations
yarn db:studio     # Open Prisma Studio
```

#### `@buildbase/tanstack-query` — Data Fetching

TanStack Query (React Query) setup with pre-configured client and typed hooks.

```tsx
import { TanStackQueryProvider } from "@buildbase/tanstack-query/provider";
import { useQuery, useMutation, useQueryClient } from "@buildbase/tanstack-query";

// Setup in layout
<TanStackQueryProvider>{children}</TanStackQueryProvider>

// Usage in components
const { data, isLoading } = useQuery({
  queryKey: ["users"],
  queryFn: fetchUsers,
});
```

#### `@buildbase/redux` — State Management

Redux Toolkit setup with persistence and typed hooks.

```tsx
import { ReduxProvider } from "@buildbase/redux/provider";
import { useAppDispatch, useAppSelector } from "@buildbase/redux/hooks";
import { increment } from "@buildbase/redux/slices/counter";

<ReduxProvider
  additionalReducers={{ user: userReducer }}
  persistConfig={{ key: "app", whitelist: ["counter", "user"] }}
>
  {children}
</ReduxProvider>

const count = useAppSelector(state => state.counter.value);
const dispatch = useAppDispatch();
dispatch(increment());
```

#### `@buildbase/cache` — Redis Caching

Upstash Redis caching with rate limiting, fallback cache, and multiple TTL strategies.

```ts
import { defaultCacheService } from "@buildbase/cache/factory";
import { generateCacheKey } from "@buildbase/cache/config";

// Set with strategy
await defaultCacheService.set(generateCacheKey.user("123", "profile"), data, {
  strategy: "user", // 30 min TTL
});

// Cache wrapper
const data = await defaultCacheService.withCache(
  "expensive-operation",
  async () => fetchExpensiveData(),
  { strategy: "api", ttl: 600 }
);

// Rate limiting
import { defaultRateLimiter, RATE_LIMIT_CONFIGS } from "@buildbase/cache/factory";

const result = await defaultRateLimiter.checkRateLimit("user:123", RATE_LIMIT_CONFIGS.API);
```

**Cache strategies:**

| Strategy  | TTL     | Use case                     |
|-----------|---------|------------------------------|
| `static`  | 1 hour  | App config, rarely-changed data |
| `dynamic` | 5 min   | Frequently-changing content  |
| `user`    | 30 min  | User-specific data           |
| `api`     | 10 min  | API responses                |

---

### API & Networking

#### `@buildbase/api-helpers` — API Utilities

Database operation utilities and API middleware.

```ts
import { getUserById, createUser } from "@buildbase/api-helpers/users";

const user = await getUserById("user-id");
```

**Cron protection middleware:**

```ts
import { withCronCheck } from "@buildbase/api-helpers/middleware/with-cron-check";

export const GET = withCronCheck(async req => {
  await runDailyTask();
  return NextResponse.json({ success: true });
});
```

#### `@buildbase/http-client` — HTTP Client

HTTP client with encryption support, pagination, and error handling.

```ts
import { ApiController } from "@buildbase/http-client/controller";

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

#### `@buildbase/qstash` — Serverless Messaging

Upstash QStash for message queuing, scheduling, and webhook verification.

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

#### `@buildbase/hooks-manager` — Common Hooks

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

#### `@buildbase/helpers` — React Helpers

React hooks and context providers for app-specific logic.

```tsx
import { useLocalStorage } from "@buildbase/helpers/hooks/use-local-storage";
import { useDebounce } from "@buildbase/helpers/hooks/use-debounce";

const [value, setValue] = useLocalStorage("key", "default");
const debouncedValue = useDebounce(value, 500);
```

#### `@buildbase/utils` — Pure Utilities

Pure utility functions with no React dependencies.

```ts
import { formatDate, formatCurrency } from "@buildbase/utils/format";
import { isValidEmail } from "@buildbase/utils/validation";

formatDate(new Date());           // "Jan 27, 2026"
formatCurrency(99.99);            // "$99.99"
isValidEmail("user@example.com"); // true
```

#### `@buildbase/crypto` — Cryptography Utilities

Encryption and hashing utilities for secure data handling.

#### `@buildbase/logger` — Structured Logging

Structured logger with log levels and environment-aware output.

#### `@buildbase/storage` — File Storage

Pluggable file storage with support for GCS, S3, and local storage.

```ts
// Configured via STORAGE_PROVIDER env var: "gcs" | "s3" | "local"
import { storage } from "@buildbase/storage";

await storage.upload(file, "path/to/file.jpg");
const url = await storage.getUrl("path/to/file.jpg");
```

#### `@buildbase/voice` — Voice Generation

ElevenLabs voice generation for the video app.

```ts
import { generateVoiceover } from "@buildbase/voice";

await generateVoiceover({ text: "Hello world", outputPath: "./audio/clip.mp3" });
```

---

### UI Management

#### `@buildbase/dialog-manager` — Dialog System

Centralized, type-safe dialog management with registry pattern.

```tsx
import { initializeCommonDialogs } from "@buildbase/dialog-manager";
import { DialogProvider } from "@buildbase/dialog-manager/provider";
import { useDialogManager, COMMON_DIALOG_KEYS } from "@buildbase/dialog-manager";

// Setup
initializeCommonDialogs();
<DialogProvider>{children}</DialogProvider>

// Open a confirmation dialog
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

// Register custom dialogs
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

### Authentication & SaaS

#### `@buildbase/saas-sdk` — BuildBase SaaS Provider

Reusable wrapper around the BuildBase SDK for authentication and workspace management.

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
</SaaSProvider>
```

**Token verification:**

```ts
import { verifySDKToken } from "@buildbase/saas-sdk/token-verification";

const result = await verifySDKToken({ code: "auth-code" });
if (result.success) {
  console.log("User:", result.user);
}
```

---

### Configuration

#### `@buildbase/env` — Environment Variables

Type-safe, validated environment variables using `@t3-oss/env-nextjs` + Zod.

```ts
import { env, isDevelopment, isProduction } from "@buildbase/env";

// Server-side (API routes, Server Components)
const dbUrl = env.DATABASE_URL;

// Client-side (NEXT_PUBLIC_* only)
const appUrl = env.NEXT_PUBLIC_PUBLIC_APP_URL;
```

**Adding new variables:**
1. Add to `packages/env/src/schema.ts`
2. Update `.env.default`
3. Add to your `.env` file

#### `@buildbase/tailwind-config` — Tailwind Configuration

Shared Tailwind CSS config for consistent styling across all apps.

```js
import sharedConfig from "@buildbase/tailwind-config";

export default {
  ...sharedConfig,
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
};
```

#### `@buildbase/eslint-config` — ESLint Configuration

```js
module.exports = { extends: ["@buildbase/eslint-config/next"] };
```

#### `@buildbase/typescript-config` — TypeScript Configuration

```json
{ "extends": "@buildbase/typescript-config/nextjs.json" }
```

#### `@buildbase/testing` — Testing Utilities

Shared testing setup and utilities for Vitest and Playwright across all apps.

---

## Environment Variables

All environment variables are managed centrally in the root `.env` file and shared across all apps via `@buildbase/env`.

### Setup

```bash
cp .env.default .env
# Fill in your values
```

### Key Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | MongoDB or PostgreSQL connection string |
| `API_SECRET` | Yes | API signing secret (min 32 chars) |
| `APP_JWT_SECRET` | Yes | JWT signing key |
| `NEXT_PUBLIC_PUBLIC_APP_URL` | Yes | Public site URL (default: `http://localhost:3100`) |
| `NEXT_PUBLIC_USER_APP_URL` | Yes | User app URL (default: `http://localhost:3101`) |
| `NEXT_PUBLIC_ADMIN_APP_URL` | Yes | Admin panel URL (default: `http://localhost:3102`) |
| `NEXT_PUBLIC_DOCS_APP_URL` | Yes | Docs site URL (default: `http://localhost:3103`) |
| `NEXT_PUBLIC_SAAS_SERVER_URL` | Yes | BuildBase API URL |
| `NEXT_PUBLIC_SAAS_ORG_ID` | Yes | BuildBase organisation ID |
| `NEXT_PUBLIC_SAAS_CLIENT_ID` | Yes | BuildBase OAuth client ID |
| `SAAS_CLIENT_SECRET` | Yes | BuildBase OAuth client secret (server-side) |
| `NEXT_PUBLIC_PLAN_GROUP_SLUG` | Yes | Plan group slug from BuildBase dashboard |
| `UPSTASH_REDIS_REST_URL` | No | Redis URL (for caching) |
| `UPSTASH_REDIS_REST_TOKEN` | No | Redis token |
| `QSTASH_TOKEN` | No | QStash token (for messaging) |
| `QSTASH_CURRENT_SIGNING_KEY` | No | QStash signing key |
| `STORAGE_PROVIDER` | No | `local` / `gcs` / `s3` (default: `local`) |
| `ELEVENLABS_API_KEY` | No | ElevenLabs key (video app only) |
| `LOG_LEVEL` | No | `trace` / `debug` / `info` / `warn` / `error` |
| `NEW_RELIC_ENABLED` | No | Enable New Relic APM |

### Validate

```bash
yarn workspace @buildbase/env validate
```

See [ENV_MANAGEMENT.md](ENV_MANAGEMENT.md) for full documentation.

---

## Scripts

| Command | Description |
|---|---|
| `yarn dev` | Start all apps in development mode |
| `yarn build` | Build all packages and apps |
| `yarn lint` | Lint all packages and apps |
| `yarn lint:fix` | Auto-fix lint errors |
| `yarn check-types` | Type check all packages and apps |
| `yarn format` | Format code with Prettier |
| `yarn format:check` | Check formatting without writing |
| `yarn db:generate` | Generate Prisma client |
| `yarn db:push` | Push schema to database |
| `yarn db:migrate` | Run database migrations |
| `yarn db:studio` | Open Prisma Studio |
| `yarn test` | Run tests across all packages |
| `yarn ralph` | Run Ralph autonomous coding agent |

---

## Ralph — Autonomous Coding Agent

Ralph is a built-in autonomous AI coding agent that works through PRD items one by one until all tasks are complete.

### Usage

1. **Edit your PRD** — add user stories to `scripts/ralph/prd.json`

2. **Run Ralph:**

   ```bash
   yarn ralph              # Claude Code, 10 iterations (default)
   yarn ralph 20           # 20 iterations
   yarn ralph:claude       # Explicit Claude Code
   yarn ralph:amp          # Use Amp instead
   ```

3. **Check progress:**
   - `scripts/ralph/prd.json` — story completion status
   - `scripts/ralph/progress.txt` — learnings and patterns

See [scripts/ralph/README.md](scripts/ralph/README.md) for full documentation.

---

## Tech Stack

| Category | Technology |
|---|---|
| **Framework** | Next.js 16 with App Router |
| **Language** | TypeScript 5 (strict mode) |
| **Styling** | Tailwind CSS + shadcn/ui + Magic UI |
| **Auth & SaaS** | BuildBase SDK |
| **Database** | Prisma ORM (MongoDB / PostgreSQL) |
| **Data Fetching** | TanStack Query |
| **State** | Redux Toolkit |
| **Caching** | Upstash Redis |
| **Messaging** | Upstash QStash |
| **Storage** | GCS / S3 / Local |
| **Voice** | ElevenLabs |
| **Monorepo** | Turborepo |
| **Package Manager** | Yarn Workspaces |

---

## Architecture

```
nextjs-starter-turborepo/
├── apps/
│   ├── public/           # Public marketing site (port 3100)
│   ├── user/             # User dashboard (port 3101)
│   ├── admin/            # Admin panel (port 3102)
│   ├── docs/             # Documentation site (port 3103)
│   ├── extension/        # Browser extension
│   └── video/            # Video editor app
├── packages/
│   ├── ui/               # Base UI components (shadcn/ui)
│   ├── magicui/          # Animated components
│   ├── components/       # Business components
│   ├── database/         # Prisma schema and client
│   ├── api-helpers/      # API utilities and middleware
│   ├── tanstack-query/   # TanStack Query setup
│   ├── redux/            # Redux Toolkit setup
│   ├── cache/            # Upstash Redis caching
│   ├── qstash/           # Upstash QStash messaging
│   ├── http-client/      # HTTP client
│   ├── hooks-manager/    # Common React hooks
│   ├── helpers/          # React helpers and context
│   ├── utils/            # Pure utility functions
│   ├── crypto/           # Cryptography utilities
│   ├── logger/           # Structured logging
│   ├── storage/          # File storage (GCS/S3/local)
│   ├── voice/            # ElevenLabs voice generation
│   ├── dialog-manager/   # Centralized dialog system
│   ├── sass-sdk/         # BuildBase SaaS provider wrapper
│   ├── env/              # Type-safe environment variables
│   ├── tailwind-config/  # Shared Tailwind config
│   ├── eslint-config/    # Shared ESLint config
│   ├── typescript-config/# Shared TypeScript config
│   └── testing/          # Shared testing utilities
├── scripts/
│   └── ralph/            # Autonomous coding agent
├── .env.default          # Environment variable template
├── ENV_MANAGEMENT.md     # Environment variable guide
├── turbo.json            # Turborepo configuration
└── package.json          # Root package.json
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for dev setup, branch guidelines, commit style, and how to report bugs.

---

## License

MIT — see [LICENSE](LICENSE) for details.

Made with ❤️ by [buildbase.app](https://www.buildbase.app)
