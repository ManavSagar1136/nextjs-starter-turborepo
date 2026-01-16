# @buildbase/cache

A comprehensive, framework-agnostic Redis cache package with Upstash Redis integration, rate limiting, and fallback caching. Designed for Vercel and edge-compatible environments.

## Features

- ✅ **Redis-based Caching**: Using Upstash Redis for distributed caching
- ✅ **Rate Limiting**: Built-in rate limiting with Upstash Ratelimit
- ✅ **Fallback Cache**: In-memory LRU cache when Redis is unavailable
- ✅ **Multiple Cache Strategies**: Static, dynamic, user, and API caching
- ✅ **Cache Versioning**: Version control for cache keys and migrations
- ✅ **Edge-Compatible**: Works in Vercel Edge Runtime and Node.js
- ✅ **Framework Agnostic**: Core functionality doesn't depend on any framework
- ✅ **TypeScript Support**: Full TypeScript support with proper typing
- ✅ **Dependency Injection**: Logger and config can be injected

## Installation

```bash
npm install @buildbase/cache
# or
yarn add @buildbase/cache
```

### Available Import Paths

- `@buildbase/cache/factory` - Factory functions and default instances
- `@buildbase/cache/service` - CacheService class
- `@buildbase/cache/fallback` - FallbackCache class
- `@buildbase/cache/rate-limiter` - Rate limiter and configs
- `@buildbase/cache/config` - Configuration and key generators
- `@buildbase/cache/versioning` - Cache versioning utilities
- `@buildbase/cache/types` - TypeScript types
- `@buildbase/cache/nextjs` - Next.js specific helpers

## Environment Variables

### Required (for Redis caching)

For Vercel, add these to your environment variables in the Vercel dashboard:

```bash
UPSTASH_REDIS_REST_URL=your_redis_url_here
UPSTASH_REDIS_REST_TOKEN=your_redis_token_here
```

**Note**: If these are not set, the cache will automatically use an in-memory fallback cache. For production, always configure Redis.

### Optional

```bash
# Enable cache warming
ENABLE_CACHE_WARMING=true

# Cache warming interval (milliseconds)
CACHE_WARMING_INTERVAL=300000
```

## Basic Usage

### Using Default Factory (Recommended for Vercel)

```typescript
import { defaultCacheService } from "@buildbase/cache/factory";

// Set a value
await defaultCacheService.set(
  "user:123",
  { name: "John" },
  {
    strategy: "user",
    ttl: 1800, // 30 minutes
  }
);

// Get a value
const result = await defaultCacheService.get("user:123");
if (result.cached && result.data) {
  console.log(result.data);
}

// Use with cache wrapper
const data = await defaultCacheService.withCache(
  "expensive-operation",
  async () => {
    // Your expensive operation
    return await fetchData();
  },
  { strategy: "api", ttl: 600 }
);
```

### Using Custom Factory

```typescript
import { createCacheFactory } from "@buildbase/cache/factory";

const cache = createCacheFactory({
  redisUrl: process.env.UPSTASH_REDIS_REST_URL,
  redisToken: process.env.UPSTASH_REDIS_REST_TOKEN,
  logger: {
    info: data => console.log(data),
    warn: data => console.warn(data),
    error: data => console.error(data),
  },
});

await cache.cacheService.set("key", "value");
```

## Rate Limiting

```typescript
import { defaultRateLimiter } from "@buildbase/cache/factory";
import { RATE_LIMIT_CONFIGS } from "@buildbase/cache/rate-limiter";

// Check rate limit
const result = await defaultRateLimiter.checkRateLimit(
  "user:123",
  RATE_LIMIT_CONFIGS.API
);

if (!result.success) {
  throw new Error(`Rate limit exceeded. Retry after ${result.retryAfter}s`);
}
```

## Cache Strategies

```typescript
import { defaultCacheService } from "@buildbase/cache/factory";
import { generateCacheKey } from "@buildbase/cache/config";

// Static content (long TTL)
await defaultCacheService.set(
  generateCacheKey.static("app-config"),
  configData,
  { strategy: "static" } // 1 hour TTL
);

// Dynamic content (medium TTL)
await defaultCacheService.set(
  generateCacheKey.dynamic("posts", "123"),
  postData,
  { strategy: "dynamic" } // 5 minutes TTL
);

// User-specific (medium TTL)
await defaultCacheService.set(
  generateCacheKey.user("user-123", "profile"),
  userProfile,
  { strategy: "user" } // 30 minutes TTL
);

// API responses (short TTL)
await defaultCacheService.set(
  generateCacheKey.api("/api/users", { page: 1 }),
  apiData,
  { strategy: "api" } // 10 minutes TTL
);

// Workspace-specific (medium TTL)
await defaultCacheService.set(
  generateCacheKey.workspace("workspace-123", "settings"),
  workspaceSettings,
  { strategy: "dynamic" } // 5 minutes TTL
);
```

## Cache Invalidation

```typescript
import { defaultCacheService } from "@buildbase/cache/factory";

// Delete specific key
await defaultCacheService.delete("user:123:profile");

// Delete by pattern
await defaultCacheService.deletePattern("user:123:*");

// Invalidate by strategy
await defaultCacheService.invalidateByStrategy("user");

// Clear all cache
await defaultCacheService.clearAll();
```

## Next.js Integration

For Next.js apps, use the Next.js-specific exports:

```typescript
// app/api/users/route.ts
import { withCacheAndRateLimit } from "@buildbase/cache/nextjs";
import { RATE_LIMIT_CONFIGS } from "@buildbase/cache/rate-limiter";

export const GET = withCacheAndRateLimit(
  async req => {
    // Your handler
    return Response.json({ users: [] });
  },
  {
    enableCache: true,
    enableRateLimit: true,
    cacheStrategy: "api",
    rateLimitConfig: RATE_LIMIT_CONFIGS.API,
  }
);
```

## Vercel Best Practices

### 1. Environment Variables

Set environment variables in Vercel Dashboard:

- Go to Project Settings → Environment Variables
- Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

### 2. Edge Runtime Compatibility

This package is fully compatible with Vercel Edge Runtime:

- Uses `btoa`/`atob` for base64 encoding (edge-compatible)
- No Node.js-specific APIs in core functionality
- Works in both Edge and Node.js runtimes

### 3. Fallback Behavior

The package automatically falls back to in-memory cache if Redis is unavailable:

- No errors thrown if Redis fails
- Graceful degradation ensures your app continues working
- Automatic retry on next request

### 4. Rate Limiting

Rate limiting works seamlessly with Vercel:

- Uses Upstash Ratelimit (edge-compatible)
- Automatically handles distributed rate limiting
- Returns proper HTTP headers for rate limit info

## Advanced Usage

### Custom Logger

```typescript
import { createCacheFactory } from "@buildbase/cache/factory";

const cache = createCacheFactory({
  logger: {
    info: data => {
      // Send to your logging service
      console.log("[INFO]", data);
    },
    warn: data => {
      console.warn("[WARN]", data);
    },
    error: data => {
      console.error("[ERROR]", data);
    },
  },
});
```

### Cache Versioning

```typescript
import { CacheVersioning } from "@buildbase/cache/versioning";

// Create versioned key
const key = CacheVersioning.createVersionedKey("user:123");

// Check if migration needed
if (CacheVersioning.needsMigration(oldKey)) {
  const newKey = CacheVersioning.migrateKey(oldKey);
}
```

## API Reference

### CacheService

- `set<T>(key, value, options?)` - Set a value in cache
- `get<T>(key)` - Get a value from cache
- `delete(key)` - Delete a key
- `deletePattern(pattern)` - Delete keys matching pattern
- `withCache<T>(key, fn, options?)` - Cache wrapper for async functions
- `invalidateByStrategy(strategy)` - Invalidate cache by strategy
- `clearAll()` - Clear all cache

### UpstashRateLimiter

- `checkRateLimit(identifier, config)` - Check rate limit
- `resetRateLimit(identifier)` - Reset rate limit
- `getRateLimitStats()` - Get rate limit statistics

## License

MIT
