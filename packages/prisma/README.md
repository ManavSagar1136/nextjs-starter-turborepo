# @repo/prisma

Shared Prisma schema and client for the monorepo.

## Schema Structure

The Prisma schema uses Prisma's native [multi-file schema support](https://www.prisma.io/blog/organize-your-prisma-schema-with-multi-file-support) (available in Prisma 6.7.0+). The schema is organized into multiple files for better maintainability:

- `prisma/schema/schema.prisma` - Generator and datasource configuration (main file)
- `prisma/schema/user.prisma` - User model
- `prisma/schema/workspace.prisma` - Workspace model
- `prisma/schema/workspace-member.prisma` - WorkspaceMember model
- `prisma/schema/*.prisma` - Additional model files as needed

Prisma automatically combines all `.prisma` files in the `prisma/schema/` directory when you run any Prisma command. This is handled natively by Prisma - no custom merge scripts needed!

## Setup

1. Set `DATABASE_URL` in your `.env` file
2. Run `yarn db:generate` to generate the Prisma client
3. Run `yarn db:push` to push schema to database (or `yarn db:migrate` for migrations)

## Adding New Models

To add a new model:

1. Create a new file in the `prisma/schema/` directory (e.g., `prisma/schema/post.prisma`)
2. Define your model in that file
3. Run `yarn db:generate` or any other Prisma command - Prisma will automatically combine all schema files

**Note:** All models can reference each other across files, so relations work seamlessly between different schema files.

## Usage

```ts
import { prisma } from "@repo/prisma";

const users = await prisma.user.findMany();
```

## Configuration

The schema directory is configured in `prisma.config.ts`. This tells Prisma where to find your schema files.
