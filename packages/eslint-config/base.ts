import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";
// @ts-expect-error - eslint-plugin-only-warn doesn't have types
import onlyWarn from "eslint-plugin-only-warn";
/**
 * A shared ESLint configuration for the repository.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const config: any[] = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
    },
  },
  {
    plugins: {
      onlyWarn,
    },
  },
  {
    ignores: ["dist/**"],
  },
];
