# BuildBase NextJS Starter Turborepo

A Turborepo monorepo for a CMS with 4 Next.js apps and shared packages.

## Structure

### Apps

- **`apps/public`** - Public showcase/landing pages (port 3100)
- **`apps/user`** - User-facing application (port 3101)
- **`apps/admin`** - Admin panel for data management (port 3102)
- **`apps/docs`** - Documentation and tutorials (port 3103)

### Packages

- **`@repo/ui`** - shadcn/ui components
- **`@repo/magicui`** - Magic UI animated components
- **`@repo/components`** - Custom business components
- **`@repo/database`** - Shared Prisma schema and client
- **`@repo/api-helpers`** - Database operation utilities
- **`@repo/utils`** - Pure utility functions
- **`@repo/helpers`** - React hooks and context providers
- **`@repo/hooks-manager`** - Centralized hooks management
- **`@repo/tanstack-query`** - TanStack Query helpers
- **`@repo/env`** - Centralized environment variable management
- **`@repo/tailwind-config`** - Shared Tailwind configuration
- **`@repo/eslint-config`** - ESLint configurations
- **`@repo/typescript-config`** - TypeScript configurations

## Getting Started

### Prerequisites

- Node.js >= 20.9.0
- Yarn 1.22.22

### Setup

1. **Install dependencies:**

   ```bash
   yarn install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Set up database:**

   ```bash
   cd packages/prisma
   yarn db:generate
   yarn db:push
   ```

4. **Start development servers:**
   ```bash
   yarn dev
   ```

## Environment Variables

Environment variables are managed centrally in the root `.env` file and shared across all apps.

### Setup

1. Copy `.env.example` to `.env`
2. Fill in your values
3. All apps will automatically use these variables

### Validation

Validate your environment variables:

```bash
yarn workspace @repo/env validate
```

### Adding New Variables

1. Add to `packages/env/src/schema.ts`
2. Update `.env.example`
3. Add to your `.env` file

See `packages/env/README.md` for more details.

## Scripts

- `yarn dev` - Start all apps in development mode
- `yarn build` - Build all packages and apps
- `yarn lint` - Lint all packages and apps
- `yarn check-types` - Type check all packages and apps
- `yarn format` - Format code with Prettier

## Tech Stack

- **Framework:** Next.js 16
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui, Magic UI
- **Database:** Prisma
- **Data Fetching:** TanStack Query
- **Monorepo:** Turborepo
- **Package Manager:** Yarn Workspaces
