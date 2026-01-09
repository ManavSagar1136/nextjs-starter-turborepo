# @repo/api-helpers

Database operation utilities and API helpers. This package provides typed helper functions for database operations using the Prisma client from `@repo/prisma`.

## Usage

```ts
import { getUserById, createUser } from "@repo/api-helpers/users";
import { prisma } from "@repo/api-helpers/prisma";
// Or directly from prisma package:
import { prisma } from "@repo/prisma";

const user = await getUserById("user-id");
const newUser = await createUser({
  email: "user@example.com",
  name: "John Doe",
});
```

## Structure

- `src/users.ts` - User-related database operations
- Add more files for other models as needed
