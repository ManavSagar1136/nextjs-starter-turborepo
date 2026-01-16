# @buildbase/api-helpers

Database operation utilities and API helpers. This package provides typed helper functions for database operations using the Prisma client from `@buildbase/database`, plus middleware for API route protection.

## Usage

### Database Helpers

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

## Middleware

### `withCronCheck` - Vercel Cron Job Protection

Middleware to validate cron secret for Vercel cron job endpoints. Includes built-in idempotency to prevent duplicate execution.

#### Features

- ✅ Validates `X-Cron-Secret` header against `CRON_SECRET` env var
- ✅ Prevents duplicate execution using cache-based idempotency
- ✅ Configurable error messages
- ✅ Development mode support
- ✅ Custom idempotency key generation

#### Basic Usage

```ts
// app/api/cron/daily-task/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withCronCheck } from "@buildbase/api-helpers/middleware/with-cron-check";

const handler = async (req: NextRequest) => {
  // Your cron job logic here
  console.log("Running daily task...");

  // Process your task
  await processDailyTask();

  return NextResponse.json({ success: true, message: "Task completed" });
};

// Protect with cron check (includes idempotency)
export const GET = withCronCheck(handler);
export const POST = withCronCheck(handler);
```

#### With Custom Options

```ts
export const POST = withCronCheck(handler, {
  headerName: "X-Custom-Secret",
  errorMessage: "Invalid cron secret provided",
  allowWithoutSecret: process.env.NODE_ENV === "development", // Allow in dev
});
```

#### Custom Idempotency Key

```ts
export const POST = withCronCheck(handler, {
  // Custom key based on request body
  idempotencyKey: async req => {
    const body = await req.json();
    // Use task ID and date for idempotency
    return `cron:${body.taskId}:${new Date().toISOString().split("T")[0]}`;
  },
  idempotencyTTL: 7200, // 2 hours
});
```

#### Disable Idempotency

```ts
export const POST = withCronCheck(handler, {
  enableIdempotency: false, // Disable duplicate prevention
});
```

#### Custom Cache Service

```ts
import { createCacheFactory } from "@buildbase/cache/factory";

const customCache = createCacheFactory({
  redisUrl: process.env.CUSTOM_REDIS_URL,
  redisToken: process.env.CUSTOM_REDIS_TOKEN,
});

export const POST = withCronCheck(handler, {
  cacheService: customCache.cacheService,
});
```

#### Environment Variables

Add to your `.env` file:

```bash
CRON_SECRET=your-super-secure-cron-secret-key
```

For Vercel, add this to your environment variables in the Vercel dashboard.

#### How Idempotency Works

1. **Key Generation**: Creates a unique key from request (URL + method + body hash + timestamp window)
2. **Cache Check**: Checks if request was already processed
3. **Cached Response**: Returns cached response if duplicate
4. **Execute**: If not cached, executes handler
5. **Cache Result**: Stores response in cache for idempotency window (default: 1 hour)

This prevents the same cron job from running multiple times if:

- Vercel retries the cron job
- Multiple instances receive the same request
- Network issues cause duplicate deliveries

#### Example: Daily Report Cron Job

```ts
// app/api/cron/daily-report/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withCronCheck } from "@buildbase/api-helpers/middleware/with-cron-check";

const handler = async (req: NextRequest) => {
  const today = new Date().toISOString().split("T")[0];

  // Generate report
  const report = await generateDailyReport(today);

  // Send report
  await sendReportEmail(report);

  return NextResponse.json({
    success: true,
    date: today,
    reportId: report.id,
  });
};

// This will prevent duplicate reports if Vercel retries
export const GET = withCronCheck(handler, {
  idempotencyKey: async () => {
    const today = new Date().toISOString().split("T")[0];
    return `daily-report:${today}`;
  },
});
```

#### Example: Processing Scheduled Jobs

```ts
// app/api/cron/process-jobs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withCronCheck } from "@buildbase/api-helpers/middleware/with-cron-check";

const handler = async (req: NextRequest) => {
  const body = await req.json();
  const { jobId } = body;

  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
  }

  // Process the job
  await processJob(jobId);

  return NextResponse.json({ success: true, jobId });
};

// Use jobId for idempotency - same job won't be processed twice
export const POST = withCronCheck(handler, {
  idempotencyKey: async req => {
    const body = await req.json();
    return `process-job:${body.jobId}`;
  },
});
```

## Structure

- `src/users.ts` - User-related database operations
- `src/middleware/with-cron-check.ts` - Cron job protection middleware
- `src/middleware/types.ts` - Middleware type definitions
- Add more files for other models as needed
