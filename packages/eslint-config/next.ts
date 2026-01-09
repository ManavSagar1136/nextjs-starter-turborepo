import js from "@eslint/js";
// Note: globalIgnores might not be available, using inline ignores instead
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginReact from "eslint-plugin-react";
import globals from "globals";
import pluginNext from "@next/eslint-plugin-next";
import { config as baseConfig } from "./base";
/**
 * A custom ESLint configuration for libraries that use Next.js.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const nextJsConfig: any[] = [
  ...baseConfig,
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    ignores: [
      // Default ignores of eslint-config-next:
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    ...(pluginReact.configs.flat.recommended || {}),
    languageOptions: {
      ...(pluginReact.configs.flat.recommended?.languageOptions || {}),
      globals: {
        ...globals.serviceworker,
      },
    },
  },
  {
    plugins: {
      "@next/next": pluginNext,
    },
    rules: {
      ...(pluginNext.configs.recommended?.rules || {}),
      ...(pluginNext.configs["core-web-vitals"]?.rules || {}),
    },
  },
  {
    plugins: {
      "react-hooks": pluginReactHooks,
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...(pluginReactHooks.configs.recommended?.rules || {}),
      // React scope no longer necessary with new JSX transform.
      "react/react-in-jsx-scope": "off",
    },
  },
];
