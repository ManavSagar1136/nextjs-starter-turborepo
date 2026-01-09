# @buildbase/utils

Pure utility functions package. Contains formatting, validation, and calculation functions with no React dependencies.

## Usage

```ts
import { formatDate, formatCurrency } from "@buildbase/utils/format";
import { isValidEmail } from "@buildbase/utils/validation";

const formatted = formatDate(new Date());
const isValid = isValidEmail("user@example.com");
const price = formatCurrency(99.99);
```

## Structure

- `src/format.ts` - Formatting utilities (dates, currency, numbers, strings)
- `src/validation.ts` - Validation functions (email, URL, phone, etc.)
