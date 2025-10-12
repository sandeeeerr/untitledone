import { FlatCompat } from '@eslint/eslintrc';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import js from "@eslint/js";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import globals from "globals";
import * as tseslint from "typescript-eslint";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/**
 * ESLint Flat Config for Next.js 15
 * Uses FlatCompat to properly integrate with Next.js ESLint plugin
 */
const eslintConfig = [
  // Extend Next.js ESLint config (this fixes the plugin detection warning)
  ...compat.config({
    extends: ['next', 'next/core-web-vitals', 'next/typescript'],
  }),
  {
  ignores: [
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "dist/**",
    "coverage/**",
    "storybook-static/**",
    "supabase/functions/**",
    "test/**",
    "cypress/**",
    "docs/**",
    ".storybook/**",
    "*.config.js",
    "*.config.cjs",
    "*.config.mjs",
    "*.config.ts"
  ]
}, {
  files: ["**/*.{js,jsx,ts,tsx}"],
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      projectService: true,
      ecmaVersion: "latest",
      sourceType: "module"
    },
    globals: {
      ...globals.browser,
      ...globals.node,
      ...globals.mocha,
      cy: true,
      Cypress: true,
      describe: true,
      it: true,
      before: true,
      beforeEach: true,
      after: true
    }
  },
  plugins: {
    react: reactPlugin,
    "react-hooks": reactHooksPlugin,
    "@typescript-eslint": tseslint.plugin
  },
  settings: {
    react: { version: "detect" }
  },
  rules: {
    // Base & TypeScript
    ...js.configs.recommended.rules,
    ...tseslint.configs.recommendedTypeChecked[0].rules,
  
    // 🧹 Cleanup: disable plain JS rule so TS version runs alone
    "no-unused-vars": "off",
  
    // ✅ Only the TypeScript variant, ignoring underscores
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_"
      }
    ],
  
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-empty-object-type": "warn",
    "@typescript-eslint/triple-slash-reference": "off",
  
    // Console & Debug
    "no-console": ["warn", { allow: ["warn", "error"] }],
  
    // React
    "react/react-in-jsx-scope": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",

    // Other minor safe disables
    "no-empty": "off",
    "no-control-regex": "off",
    "no-undef": "off"
  }
}];

export default eslintConfig;
