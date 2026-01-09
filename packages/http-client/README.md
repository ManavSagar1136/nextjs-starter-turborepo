# @buildbase/http-client

HTTP client package for making API requests with encryption support, pagination, and error handling.

## Usage

### Basic API Controller

```typescript
import { ApiController } from "@buildbase/http-client/controller";
import { HttpClientConfig } from "@buildbase/http-client/types";

const config: HttpClientConfig = {
  serverUrl: "http://localhost:3000/api",
  secretKey: "your-secret-key", // Optional
  encryptData: false, // Optional, defaults to false
  storageKeys: {
    TOKEN: "token", // Optional
  },
};

class UsersController extends ApiController {
  protected urlPath = "/users";

  constructor() {
    super(config);
  }

  async getUser(id: string) {
    return (await this.get(`/${id}`, {}, {})).data;
  }

  async createUser(data: any) {
    return (await this.post("/", {}, {}, data)).data;
  }
}

// Usage
const usersController = new UsersController();
```

### Pagination API Controller

```typescript
import { ApiPaginationController } from "@buildbase/http-client/pagination";
import {
  IPageFilter,
  PaginationResponse,
  HttpClientConfig,
} from "@buildbase/http-client/types";

interface User {
  id: string;
  name: string;
  email: string;
}

const config: HttpClientConfig = {
  serverUrl: "http://localhost:3000/api",
  secretKey: "your-secret-key", // Optional
  encryptData: false, // Optional
};

class UsersPaginationController extends ApiPaginationController<User> {
  protected urlPath = "/users";

  constructor() {
    super(config);
  }

  // Inherits methods: create, update, remove, getOne, getPage, getAll, getChart, getCounts
}

// Usage
const usersController = new UsersPaginationController();
const users = await usersController.getPage({
  $limit: 10,
  $page: 1,
  sorting: [{ id: "name", desc: false }],
});
```

### Global Config (Optional - for backward compatibility)

If you prefer to use a global config instead of passing it to each controller:

```typescript
import { setHttpClientConfig } from "@buildbase/http-client/base";

// Configure the HTTP client globally
setHttpClientConfig({
  serverUrl: "http://localhost:3000/api",
  secretKey: "your-secret-key",
  encryptData: false,
});

// Then controllers can be instantiated without passing config
// (they will fall back to global config if no config is provided)
```

## Exports

- `./base` - HTTP request functions (get, post, patch, put, delete, upload) and config
- `./types` - TypeScript types and interfaces
- `./controller` - Base API controller class
- `./pagination` - Pagination API controller class
