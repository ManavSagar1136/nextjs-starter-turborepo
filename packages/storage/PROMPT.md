# PROMPT.md - Ralph Loop Instructions

You are building a multi-provider storage package. Read PRD.md for full specs.

## Current Phase: 1 - Core Structure

## Reference Implementation

Check `/Users/dharmendra/clawd/saas-template-ref/src/lib/assets/` for reference:

- `upload.factory.ts` - Factory pattern
- `types.ts` - Type definitions
- `google-cloud.provider.ts` - GCS implementation

## Your Task

Continue building the storage package. Check PROGRESS.md for what's done.

### Phase 1 Priority Order

1. **If no package.json:** Create package scaffolding
2. **If no types:** Create `src/types.ts` with interfaces
3. **If no factory:** Create `src/factory.ts` with StorageFactory
4. **If no base provider:** Create `src/providers/base.provider.ts`
5. **If base done:** Move to Phase 2 (GCS)

### File Locations

```
packages/storage/
├── package.json
├── tsconfig.json
├── eslint.config.ts
├── src/
│   ├── index.ts              # Main exports
│   ├── types.ts              # Type definitions
│   ├── factory.ts            # StorageFactory
│   ├── config.ts             # Configuration
│   ├── providers/
│   │   ├── base.provider.ts
│   │   ├── gcs.provider.ts
│   │   ├── s3.provider.ts
│   │   └── local.provider.ts
│   └── utils/
│       ├── content-type.ts
│       └── validation.ts
```

### Monorepo Patterns (FOLLOW!)

1. Package name: `@buildbase/storage`
2. Use ESM: `"type": "module"`
3. Exports pattern from `@buildbase/cache`:

```json
{
  "exports": {
    ".": "./dist/index.js",
    "./factory": "./dist/factory.js",
    "./types": "./dist/types.js",
    "./providers/gcs": "./dist/providers/gcs.provider.js"
  }
}
```

4. Dev dependencies from workspace:

```json
{
  "@buildbase/eslint-config": "*",
  "@buildbase/typescript-config": "*"
}
```

### Rules

1. Write working code, not placeholders
2. Test your changes compile before finishing
3. Update PROGRESS.md after each session
4. Commit and push after each update
5. TypeScript strict - no `any` types

### Provider Selection

```typescript
// Via environment variable
const provider = process.env.STORAGE_PROVIDER || "gcs";

// Or via override
StorageFactory.getProvider("s3"); // Override env
```

### When Done

1. Run `yarn build` to verify no errors
2. Run tests: `yarn test`
3. Update PROGRESS.md
4. Commit with descriptive message
5. Push to remote

---

## Signs (Guardrails)

⚠️ **DO NOT:**

- Use `any` types
- Skip TypeScript errors
- Leave TODO comments
- Hardcode credentials
- Use CommonJS (require/module.exports)

✅ **ALWAYS:**

- Follow monorepo package patterns
- Use environment variables for config
- Write complete, working code
- Add proper error handling
- Export types for consumers

---

_Read PROGRESS.md to see current state before starting._
