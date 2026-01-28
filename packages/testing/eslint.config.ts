import { config } from "@buildbase/eslint-config/react-internal";
import type { Linter } from "eslint";

export default [
  ...config,
  {
    rules: {
      // Testing package uses Playwright's `use` function, not React hooks
      "react-hooks/rules-of-hooks": "off",
      // Allow require() in fixtures for dynamic imports
      "@typescript-eslint/no-require-imports": "off",
      // Turbo env vars are set by CI, not declared
      "turbo/no-undeclared-env-vars": "off",
    },
  },
] satisfies Linter.Config[];
