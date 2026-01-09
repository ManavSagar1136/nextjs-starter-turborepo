# @buildbase/api-helpers

Database operation utilities and API helpers. This package provides typed helper functions for database operations using the Prisma client from `@buildbase/database`.

## Usage

```ts
import { getUserById, createUser } from "@buildbase/api-helpers/users";
import { prisma } from "@buildbase/api-helpers/prisma";
// Or directly from database package:
import { prisma } from "@buildbase/database";

const user = await getUserById("user-id");
const newUser = await createUser({
  email: "user@example.com",
  name: "John Doe",
});
```

## Structure

- `src/users.ts` - User-related database operations
- Add more files for other models as needed
