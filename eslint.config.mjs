// eslint.config.mjs
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/.turbo/**",
      "**/vite.config.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
      parserOptions: {
        // Use the modern project service for type-aware linting
        projectService: {
          // Allow files not included in any tsconfig to be linted without error
          // This is crucial for config files and standalone packages
          allowDefaultProject: [
            "eslint.config.mjs",
            "packages/contract/index.ts",
            // Add any other files that aren't part of a tsconfig
          ],
        },
        // CRITICAL: Point this to the MONOREPO ROOT, not a sub-package
        // import.meta.dirname resolves to the directory of this config file
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
);
