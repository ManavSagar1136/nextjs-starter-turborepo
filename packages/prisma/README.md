# @repo/prisma

Shared Prisma schema and client for the monorepo.

## Setup

1. Set `DATABASE_URL` in your `.env` file
2. Run `yarn db:generate` to generate the Prisma client
3. Run `yarn db:push` to push schema to database (or `yarn db:migrate` for migrations)

## Usage

```ts
import { prisma } from "@repo/prisma";

const users = await prisma.user.findMany();
```
