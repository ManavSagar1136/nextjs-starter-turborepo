# Pagination Utilities

This package provides `paginatePrisma` - a comprehensive backend utility for handling pagination, filtering, sorting, and relation population in Prisma queries.

## Installation

The pagination utilities are part of `@buildbase/api-helpers` package:

```ts
import { paginatePrisma } from "@buildbase/api-helpers/paginate-prisma";
import { prisma } from "@buildbase/api-helpers/prisma";
```

## Basic Usage

### Simple Pagination

```ts
// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { paginatePrisma } from "@buildbase/api-helpers/paginate-prisma";
import { prisma } from "@buildbase/api-helpers/prisma";

export async function GET(request: NextRequest) {
  const result = await paginatePrisma(
    request,
    prisma.user,
    {} // Extra filter
  );

  return NextResponse.json(result);
}
```

**Request**: `GET /api/users?$page=1&$limit=10`

**Response**:

```json
{
  "docs": [...],
  "totalDocs": 100,
  "limit": 10,
  "totalPages": 10,
  "page": 1,
  "pagingCounter": 1,
  "hasPrevPage": false,
  "hasNextPage": true,
  "prevPage": null,
  "nextPage": 2
}
```

### With Filtering

```ts
export async function GET(request: NextRequest) {
  const result = await paginatePrisma(
    request,
    prisma.user,
    { status: "ACTIVE" } // Extra filter
  );

  return NextResponse.json(result);
}
```

**Request**: `GET /api/users?$page=1&$limit=10&filter[status][$eq]=ACTIVE`

### With Relations

```ts
export async function GET(request: NextRequest) {
  const result = await paginatePrisma(
    request,
    prisma.user,
    {},
    {
      workspace: true, // Include workspace relation
      profile: {
        select: {
          name: true,
          email: true,
        },
      },
    }
  );

  return NextResponse.json(result);
}
```

### With Sorting

**Request**: `GET /api/users?$page=1&$limit=10&sort[createdAt]=-1&sort[name]=1`

- `-1` = descending
- `1` = ascending
- `0` = no sort (skip)

### With Complex Filters

**Request**: `GET /api/users?filter[status][$eq]=ACTIVE&filter[age][$gte]=18&filter[email][$contains]=@example.com`

### Supported Filter Operations

- `$eq` - Equals
- `$ne` - Not equals
- `$in` - In array
- `$notIn` - Not in array
- `$gt` - Greater than
- `$gte` - Greater than or equal
- `$lt` - Less than
- `$lte` - Less than or equal
- `$contains` - String contains
- `$startsWith` - String starts with
- `$endsWith` - String ends with
- `$regex` - Regular expression
- `$isNull` - Is null
- `$isNotNull` - Is not null
- `$isEmpty` - Is empty
- `$has` - Array contains
- `$hasEvery` - Array contains all
- `$hasSome` - Array contains any

### With OR/AND Conditions

**Request**: `GET /api/users?filter[OR][0][status][$eq]=ACTIVE&filter[OR][0][role][$eq]=ADMIN&filter[AND][0][age][$gte]=18`

### Disable Pagination

**Request**: `GET /api/users?pagination=false` - Returns all results

### With Grouping

```ts
export async function GET(request: NextRequest) {
  const result = await paginatePrisma(request, prisma.order, {}, undefined, {
    field: "batchId", // Group by this field
    aggregate: items => ({
      // Custom aggregation logic
      batchId: items[0].batchId,
      totalAmount: items.reduce((sum, item) => sum + item.amount, 0),
      count: items.length,
      items,
    }),
  });

  return NextResponse.json(result);
}
```

**Request**: `GET /api/orders?groupBy=batchId` - Groups results by `batchId` field

### Automatic User-Based Filtering

The `paginatePrisma` function automatically filters results for users with `APP_ROLES.USER` role who don't have organization access. When `request.userData?.role === APP_ROLES.USER && !request.orgAccess`, it automatically adds `userId: request.userData.id` to the where clause to prevent users from accessing other users' data.

This filtering is built-in and requires no additional configuration.

## Function Signature

```ts
export async function paginatePrisma<T>(
  request: NextRequest,
  model: any, // Prisma model (e.g., prisma.user)
  extraFilter: Record<string, any>, // Additional filters (can be empty object {})
  populateFields?: Record<string, any>, // Relations/fields to include
  groupByConfig?: {
    field: string; // Field to group by (e.g., "batchId")
    aggregate?: (group: any[]) => any; // Optional custom aggregation logic
  },
  options?: {
    useInclude?: boolean; // If true, use include (additive), if false use select (exclusive). Default: auto-detect
    mongoFilter?: Record<string, any>; // MongoDB native filter for JSON fields (MongoDB only)
  }
): Promise<PaginatedResult<T>>;
```

## Return Type

```ts
interface PaginatedResult<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
  groups?: any[];
}
```

## Frontend Integration

The frontend `ApiPaginationController` in `@buildbase/http-client` is already compatible with this backend utility. Use it like:

```ts
import { ApiPaginationController } from "@buildbase/http-client/pagination";

class UserApi extends ApiPaginationController<User> {
  protected urlPath = "/api/users";
}

const userApi = new UserApi(config);
const result = await userApi.getPage({
  $page: 1,
  $limit: 10,
  filter: {
    status: { $eq: "ACTIVE" },
  },
});
```
