# Contributing to BuildBase Turborepo Starter

Thank you for your interest in contributing! This document covers how to set up the project, submit changes, and what we look for in contributions.

## Ways to Contribute

- **Bug reports** — Open an [issue](https://github.com/buildbase-app/nextjs-starter-turborepo/issues) with a clear description and steps to reproduce
- **Bug fixes** — Fork, fix, and open a PR referencing the issue
- **Documentation** — Fix typos, improve examples, or clarify confusing sections in `README.md` or `ENV_MANAGEMENT.md`
- **Feature requests** — Open an issue first to discuss before building

> For large features or breaking changes, **always open an issue first** to align before writing code.

---

## Development Setup

### Prerequisites

- Node.js >= 20.9.0
- Yarn 1.22.22
- MongoDB or PostgreSQL database
- [BuildBase](https://www.buildbase.app) account

### Install dependencies

```bash
git clone https://github.com/buildbase-app/nextjs-starter-turborepo.git
cd nextjs-starter-turborepo
yarn install
```

### Set up environment

```bash
cp .env.default .env
# Fill in your values — see ENV_MANAGEMENT.md
```

### Set up the database

```bash
yarn db:generate
yarn db:push
```

### Start development servers

```bash
yarn dev
```

---

## Project Structure

```
apps/
├── public/      # Public marketing site (port 3100)
├── user/        # User dashboard (port 3101)
├── admin/       # Admin panel (port 3102)
├── docs/        # Documentation site (port 3103)
├── extension/   # Browser extension
└── video/       # Video editor

packages/
├── ui/               # shadcn/ui primitives
├── components/       # Business components
├── database/         # Prisma schema and client
├── sass-sdk/         # BuildBase SaaS provider wrapper
├── env/              # Type-safe env vars
├── cache/            # Redis caching
├── qstash/           # QStash messaging
└── ...               # See README for full list
```

---

## Available Scripts

| Command | Description |
|---|---|
| `yarn dev` | Start all apps |
| `yarn build` | Build all packages and apps |
| `yarn lint` | Lint all code |
| `yarn lint:fix` | Auto-fix lint errors |
| `yarn check-types` | TypeScript type check |
| `yarn format` | Format with Prettier |
| `yarn format:check` | Check formatting |
| `yarn test` | Run all tests |

---

## Pull Request Guidelines

1. **Branch** off `main` — name your branch `fix/short-description` or `feat/short-description`
2. **Keep PRs small** — one fix or one feature per PR
3. **Run checks** before committing:
   ```bash
   yarn lint && yarn check-types && yarn format:check
   ```
4. **Update the README** if your change adds, removes, or modifies a package, app, or environment variable
5. **Write a clear PR description** — what changed, why, and how to test it

---

## Commit Style

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add @buildbase/analytics package
fix: resolve workspace switch race condition in sass-sdk
docs: update ENV_MANAGEMENT.md with new variables
chore: bump turbo to v2.8
```

---

## Reporting Bugs

Open an issue at [github.com/buildbase-app/nextjs-starter-turborepo/issues](https://github.com/buildbase-app/nextjs-starter-turborepo/issues) and include:

- Node.js and Yarn versions
- Which app or package is affected
- Steps to reproduce
- Expected vs actual behaviour
- Error logs if available

---

## Questions & Support

- **Email**: [support@buildbase.app](mailto:support@buildbase.app)
- **Website**: [buildbase.app](https://www.buildbase.app)
- **Issues**: [github.com/buildbase-app/nextjs-starter-turborepo/issues](https://github.com/buildbase-app/nextjs-starter-turborepo/issues)
