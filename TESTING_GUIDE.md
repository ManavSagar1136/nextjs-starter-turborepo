# Testing Guide

Comprehensive testing guide for the BuildBase NextJS Starter. This document covers testing strategy, tools, and best practices for maintaining code quality.

## Testing Strategy

We follow the **Testing Pyramid** approach:

```
         ┌─────────────┐
         │    E2E      │  ~10% - Critical user journeys
         │ (Playwright)│
         └──────┬──────┘
         ┌──────┴──────┐
         │ Integration │  ~20% - API routes, DB operations
         │  (Vitest)   │
         └──────┬──────┘
    ┌───────────┴───────────┐
    │      Unit Tests       │  ~70% - Components, hooks, utils
    │       (Vitest)        │
    └───────────────────────┘
```

## Quick Reference

| Test Type   | Tool         | Location                   | Command                 |
| ----------- | ------------ | -------------------------- | ----------------------- |
| Unit        | Vitest + RTL | `**/*.test.ts(x)`          | `yarn test:unit`        |
| Integration | Vitest + MSW | `**/*.integration.test.ts` | `yarn test:integration` |
| E2E         | Playwright   | `e2e/**/*.spec.ts`         | `yarn test:e2e`         |

## Unit Testing

### Setup

```ts
// vitest.config.ts
import { defineConfig, mergeConfig } from "vitest/config";
import { sharedVitestConfig } from "@buildbase/testing/config/vitest";

export default mergeConfig(
  sharedVitestConfig,
  defineConfig({
    test: {
      setupFiles: ["@buildbase/testing/setup/unit"],
    },
  })
);
```

### Writing Unit Tests

#### Testing Components

```tsx
import { render, screen, userEvent } from "@buildbase/testing";
import { Button } from "./Button";

describe("Button", () => {
  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    const { user } = render(<Button onClick={onClick}>Click me</Button>);

    await user.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Click me</Button>);

    expect(screen.getByRole("button")).toBeDisabled();
  });
});
```

#### Testing Hooks

```tsx
import { renderHook, act } from "@buildbase/testing";
import { useCounter } from "./useCounter";

describe("useCounter", () => {
  it("increments count", () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });
});
```

#### Testing Utilities

```ts
import { formatDate, formatCurrency } from "@buildbase/utils/format";

describe("formatDate", () => {
  it("formats date correctly", () => {
    const date = new Date("2026-01-28");
    expect(formatDate(date)).toBe("Jan 28, 2026");
  });
});
```

### Using Mocks

#### Prisma Mock

```ts
import { prismaMock, resetPrismaMock } from "@buildbase/testing/mocks/prisma";
import { createUserFixture } from "@buildbase/testing/fixtures";

vi.mock("@buildbase/database", () => ({
  prisma: prismaMock,
}));

describe("UserService", () => {
  beforeEach(() => resetPrismaMock());

  it("finds user by id", async () => {
    const mockUser = createUserFixture();
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const result = await findUserById(mockUser.id);

    expect(result).toEqual(mockUser);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: mockUser.id },
    });
  });
});
```

#### Next.js Mocks

```ts
import { mockRouter, resetNextMocks } from '@buildbase/testing/mocks/next';

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

beforeEach(() => resetNextMocks());

it('navigates to dashboard', async () => {
  render(<LoginButton />);
  await userEvent.click(screen.getByText('Login'));

  expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
});
```

## Integration Testing

### Setup

```ts
// vitest.config.integration.ts
import { defineConfig, mergeConfig } from "vitest/config";
import { sharedVitestConfig } from "@buildbase/testing/config/vitest";

export default mergeConfig(
  sharedVitestConfig,
  defineConfig({
    test: {
      include: ["**/*.integration.test.ts"],
      setupFiles: ["@buildbase/testing/setup/integration"],
      testTimeout: 30000,
    },
  })
);
```

### Testing API Routes

```ts
import { testApiRoute } from "@buildbase/testing/utils/api-test";
import { prismaMock } from "@buildbase/testing/mocks/prisma";
import { createUserFixture } from "@buildbase/testing/fixtures";
import { GET, POST } from "./route";

vi.mock("@buildbase/database", () => ({
  prisma: prismaMock,
}));

describe("GET /api/users", () => {
  it("returns users list", async () => {
    const users = [createUserFixture(), createUserFixture()];
    prismaMock.user.findMany.mockResolvedValue(users);

    const { status, data } = await testApiRoute(GET, { method: "GET" });

    expect(status).toBe(200);
    expect(data.users).toHaveLength(2);
  });

  it("returns 401 when unauthorized", async () => {
    const { status, data } = await testApiRoute(GET, {
      method: "GET",
      // No auth header
    });

    expect(status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });
});

describe("POST /api/users", () => {
  it("creates new user", async () => {
    const newUser = createUserFixture();
    prismaMock.user.create.mockResolvedValue(newUser);

    const { status, data } = await testApiRoute(POST, {
      method: "POST",
      body: { email: "new@example.com", name: "New User" },
      headers: { Authorization: "Bearer valid-token" },
    });

    expect(status).toBe(201);
    expect(data.user.email).toBe(newUser.email);
  });
});
```

### Testing with MSW

```ts
import { server, http, HttpResponse } from "@buildbase/testing/mocks/http";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it("fetches external API data", async () => {
  server.use(
    http.get("https://api.external.com/data", () => {
      return HttpResponse.json({ items: [1, 2, 3] });
    })
  );

  const result = await fetchExternalData();

  expect(result.items).toHaveLength(3);
});
```

## E2E Testing

### Setup

```ts
// playwright.config.ts
import { createPlaywrightConfig } from "@buildbase/testing/config/playwright";

export default createPlaywrightConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://localhost:3101",
  },
  webServer: {
    command: "yarn dev",
    url: "http://localhost:3101",
    reuseExistingServer: !process.env.CI,
  },
});
```

### Auth Setup

```ts
// e2e/auth.setup.ts
import { test as setup } from "@playwright/test";
import { AUTH_FILE } from "@buildbase/testing/e2e/fixtures";

setup("authenticate", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.TEST_USER_EMAIL!);
  await page.getByLabel("Password").fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("/dashboard");
  await page.context().storageState({ path: AUTH_FILE });
});
```

### Writing E2E Tests

#### Using Page Object Models

```ts
import { test, expect } from "@playwright/test";
import { DashboardPage, LoginPage } from "@buildbase/testing/e2e/pages";

test.describe("Dashboard", () => {
  test("shows welcome message", async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await expect(dashboard.welcomeMessage).toBeVisible();
  });

  test("allows workspace switching", async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await dashboard.selectWorkspace("My Workspace");

    const currentWorkspace = await dashboard.getCurrentWorkspace();
    expect(currentWorkspace).toContain("My Workspace");
  });
});
```

#### Using Helpers

```ts
import { test, expect } from "@playwright/test";
import { fillForm, submitForm, gotoAndWait } from "@buildbase/testing/e2e/helpers";

test("contact form submission", async ({ page }) => {
  await gotoAndWait(page, "/contact");

  await fillForm(page, {
    Name: "John Doe",
    Email: "john@example.com",
    Message: "Hello!",
  });

  await submitForm(page, "Send Message");

  await expect(page.getByText("Message sent!")).toBeVisible();
});
```

## Fixtures

### Creating Test Data

```ts
import {
  createUserFixture,
  createWorkspaceFixture,
  createUsersFixture,
} from "@buildbase/testing/fixtures";

// Basic usage
const user = createUserFixture();
const workspace = createWorkspaceFixture();

// With overrides
const admin = createUserFixture({
  role: "admin",
  email: "admin@example.com",
});

// Multiple entities
const users = createUsersFixture(10, { role: "member" });
```

### Updating Fixtures (Schema Changes)

When the Prisma schema changes:

1. **Update fixture type** to match new schema
2. **Add Faker generator** for new fields
3. **Update tests** that use the fixture

```ts
// Example: Adding 'phone' field to User

// 1. Update type
export interface User {
  // ... existing fields
  phone: string | null; // New field
}

// 2. Update fixture
export function createUserFixture(overrides: UserOverrides = {}): User {
  return {
    // ... existing fields
    phone: faker.phone.number(), // New field
    ...overrides,
  };
}

// 3. Tests automatically get the new field
```

## Best Practices

### Test Naming

```ts
describe("[ComponentName]", () => {
  describe("[methodName or scenario]", () => {
    it("should [expected behavior] when [condition]", () => {});
  });
});

// Example
describe("UserCard", () => {
  describe("when user is admin", () => {
    it("should display admin badge", () => {});
  });
});
```

### AAA Pattern

```ts
it("should create user when valid data provided", async () => {
  // Arrange
  const userData = createUserFixture();
  prismaMock.user.create.mockResolvedValue(userData);

  // Act
  const result = await createUser(userData);

  // Assert
  expect(result).toEqual(userData);
});
```

### Test Isolation

- Each test should be independent
- Use `beforeEach` to reset state
- Never rely on test execution order
- Clean up side effects in `afterEach`

### Async Testing

```ts
// ✅ Good
it("handles async operations", async () => {
  await expect(asyncOperation()).resolves.toBe("result");
});

// ✅ Good for errors
it("handles async errors", async () => {
  await expect(failingOperation()).rejects.toThrow("error");
});

// ❌ Bad - no await
it("handles async operations", () => {
  expect(asyncOperation()).resolves.toBe("result");
});
```

## Coverage Requirements

| Category   | Minimum | Target |
| ---------- | ------- | ------ |
| Statements | 80%     | 90%    |
| Branches   | 75%     | 85%    |
| Functions  | 80%     | 90%    |
| Lines      | 80%     | 90%    |

### Excluded from Coverage

- Configuration files (`*.config.*`)
- Type definitions (`*.d.ts`)
- Generated code (`generated/`)
- Test files (`*.test.*`, `*.spec.*`)
- Mock files (`mocks/`)

## CI/CD

Tests run automatically on:

- Push to `main` or `develop`
- Pull requests to `main` or `develop`

### Workflow Jobs

1. **Unit Tests** - Fast, run on all PRs
2. **Type Check & Lint** - Code quality
3. **Build** - Verify compilation
4. **E2E Tests** - Run on PRs to main only

## Troubleshooting

### Common Issues

**Tests timeout**

- Increase timeout: `test.timeout(30000)`
- Check for unresolved promises
- Ensure mocks are properly configured

**Mock not working**

- Ensure `vi.mock()` is at file top level
- Check mock reset in `beforeEach`
- Verify import paths match

**E2E tests flaky**

- Add explicit waits: `await page.waitForLoadState('networkidle')`
- Use test IDs: `data-testid="my-element"`
- Check for race conditions

## Resources

- [@buildbase/testing README](packages/testing/README.md)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [MSW Documentation](https://mswjs.io/)
