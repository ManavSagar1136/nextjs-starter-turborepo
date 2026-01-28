# @buildbase/testing

Enterprise-grade testing utilities for the BuildBase NextJS Starter. Provides shared configurations, mocks, fixtures, and helpers for unit, integration, and E2E testing.

## Installation

This package is included in the monorepo workspaces. No additional installation needed.

## Quick Start

```ts
// Unit test with fixtures and mocks
import { render, screen, userEvent } from '@buildbase/testing';
import { createUserFixture } from '@buildbase/testing/fixtures';
import { prismaMock } from '@buildbase/testing/mocks/prisma';

describe('UserCard', () => {
  it('displays user info', async () => {
    const user = createUserFixture({ name: 'John Doe' });
    const { user: userEvent } = render(<UserCard user={user} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

## Package Structure

```
packages/testing/
├── src/
│   ├── config/              # Test configurations
│   │   ├── vitest.config.ts     # Shared Vitest config
│   │   └── playwright.config.ts # Shared Playwright config
│   │
│   ├── setup/               # Test setup files
│   │   ├── unit.setup.ts        # Unit test setup
│   │   └── integration.setup.ts # Integration test setup
│   │
│   ├── mocks/               # Mock implementations
│   │   ├── prisma.mock.ts       # Prisma client mock
│   │   ├── next.mock.ts         # Next.js mocks
│   │   ├── http.mock.ts         # MSW HTTP mocks
│   │   ├── redis.mock.ts        # Cache/Redis mock
│   │   ├── buildbase.mock.ts    # Buildbase SDK mock
│   │   └── qstash.mock.ts       # QStash mock
│   │
│   ├── fixtures/            # Test data factories
│   │   ├── user.fixture.ts      # User factory
│   │   └── workspace.fixture.ts # Workspace factory
│   │
│   ├── utils/               # Test utilities
│   │   ├── render.tsx           # Custom render with providers
│   │   └── api-test.ts          # API route testing helpers
│   │
│   └── e2e/                 # E2E testing utilities
│       ├── pages/               # Page Object Models
│       ├── fixtures/            # Playwright fixtures
│       └── helpers/             # E2E helpers
```

## Exports

### Main Entry (`@buildbase/testing`)

```ts
import { render, screen, userEvent, waitFor } from "@buildbase/testing";
```

### Fixtures (`@buildbase/testing/fixtures`)

```ts
import {
  createUserFixture,
  createAdminFixture,
  createUsersFixture,
  createWorkspaceFixture,
  createWorkspacesFixture,
} from "@buildbase/testing/fixtures";

// Create a user
const user = createUserFixture();

// Create with overrides
const admin = createUserFixture({ role: "admin", email: "admin@test.com" });

// Create multiple
const users = createUsersFixture(10);
```

### Mocks

#### Prisma Mock (`@buildbase/testing/mocks/prisma`)

```ts
import { prismaMock, resetPrismaMock } from "@buildbase/testing/mocks/prisma";

// Mock in your test file
vi.mock("@buildbase/database", () => ({
  prisma: prismaMock,
}));

describe("UserService", () => {
  beforeEach(() => resetPrismaMock());

  it("finds user", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "1",
      email: "test@example.com",
    });

    const user = await findUserById("1");
    expect(user.email).toBe("test@example.com");
  });
});
```

#### Next.js Mock (`@buildbase/testing/mocks/next`)

```ts
import {
  mockRouter,
  mockSearchParams,
  mockCookies,
  resetNextMocks,
} from '@buildbase/testing/mocks/next';

beforeEach(() => resetNextMocks());

it('navigates on click', async () => {
  render(<MyComponent />);
  await userEvent.click(screen.getByText('Go'));
  expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
});
```

#### HTTP Mock (`@buildbase/testing/mocks/http`)

```ts
import { server, http, HttpResponse } from "@buildbase/testing/mocks/http";

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it("fetches users", async () => {
  server.use(
    http.get("/api/users", () => {
      return HttpResponse.json([{ id: "1", name: "John" }]);
    })
  );

  const users = await fetchUsers();
  expect(users).toHaveLength(1);
});
```

#### Buildbase SDK Mock (`@buildbase/testing/mocks/buildbase`)

```ts
import {
  buildbaseMock,
  resetBuildbaseMock,
} from "@buildbase/testing/mocks/buildbase";

vi.mock("@buildbase/sdk", () => ({
  default: buildbaseMock,
}));

beforeEach(() => resetBuildbaseMock());

it("gets session", async () => {
  const session = await buildbaseMock.auth.getSession();
  expect(session.user.email).toBe("test@example.com");
});
```

### API Testing (`@buildbase/testing/utils/api-test`)

```ts
import { testApiRoute, createMockRequest } from "@buildbase/testing/utils/api-test";
import { GET, POST } from "@/app/api/users/route";

describe("GET /api/users", () => {
  it("returns users", async () => {
    const { status, data } = await testApiRoute(GET, { method: "GET" });

    expect(status).toBe(200);
    expect(data.users).toBeDefined();
  });
});

describe("POST /api/users", () => {
  it("creates user", async () => {
    const { status, data } = await testApiRoute(POST, {
      method: "POST",
      body: { email: "new@example.com" },
      headers: { Authorization: "Bearer token" },
    });

    expect(status).toBe(201);
  });
});
```

### E2E Testing

#### Page Object Models (`@buildbase/testing/e2e/pages`)

```ts
import { LoginPage, DashboardPage } from "@buildbase/testing/e2e/pages";

test("user can login", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login("user@example.com", "password");

  const dashboard = new DashboardPage(page);
  await dashboard.expectWelcomeMessage();
});
```

#### Auth Fixtures (`@buildbase/testing/e2e/fixtures`)

```ts
// e2e/auth.setup.ts
import { test as setup } from "@playwright/test";
import { AUTH_FILE } from "@buildbase/testing/e2e/fixtures";

setup("authenticate", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.TEST_EMAIL!);
  await page.getByLabel("Password").fill(process.env.TEST_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("/dashboard");
  await page.context().storageState({ path: AUTH_FILE });
});
```

#### E2E Helpers (`@buildbase/testing/e2e/helpers`)

```ts
import { fillForm, submitForm, gotoAndWait } from "@buildbase/testing/e2e/helpers";

test("form submission", async ({ page }) => {
  await gotoAndWait(page, "/contact");
  await fillForm(page, {
    Name: "John Doe",
    Email: "john@example.com",
  });
  await submitForm(page);
});
```

## Configuration

### Using Shared Vitest Config

```ts
// vitest.config.ts in your app/package
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

### Using Shared Playwright Config

```ts
// playwright.config.ts in your app
import { createPlaywrightConfig } from "@buildbase/testing/config/playwright";

export default createPlaywrightConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://localhost:3101",
  },
  webServer: {
    command: "yarn dev",
    url: "http://localhost:3101",
  },
});
```

## Adding New Fixtures

When the Prisma schema changes, update fixtures:

1. Edit `src/fixtures/user.fixture.ts` or `workspace.fixture.ts`
2. Add new fields with Faker.js generators
3. Update types to match Prisma schema
4. Export from `src/fixtures/index.ts`

```ts
// Example: Adding a new field
export function createUserFixture(overrides: UserOverrides = {}): User {
  return {
    // ... existing fields
    newField: faker.lorem.word(),
    ...overrides,
  };
}
```

## Adding New Mocks

1. Create file in `src/mocks/`
2. Export mock object with `vi.fn()` methods
3. Export reset function
4. Add to package.json exports

```ts
// src/mocks/myservice.mock.ts
import { vi } from "vitest";

export const myServiceMock = {
  doThing: vi.fn().mockResolvedValue({ success: true }),
};

export function resetMyServiceMock() {
  myServiceMock.doThing.mockClear();
}
```

## Scripts

```bash
# Run tests
yarn workspace @buildbase/testing test

# Run tests in watch mode
yarn workspace @buildbase/testing test:watch

# Build package
yarn workspace @buildbase/testing build

# Type check
yarn workspace @buildbase/testing check-types
```

## Related Docs

- [Testing Guide](../../TESTING_GUIDE.md) - Comprehensive testing strategy
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
