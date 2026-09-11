import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

// Prettier owns formatting, so nothing here is stylistic. The rules that earn
// their place are the ones a type error would not catch: unused code, unsafe
// escapes from the type system, and the hooks rules both apps depend on.
export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.turbo/**",
      "**/.wrangler/**",
      "**/.react-router/**",
      "**/.expo/**",
      "apps/mobile/ios/**",
      "apps/mobile/android/**",
      "apps/mobile/store/out/**",
      "tools/**",
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // Expo's toolchain reads these as CommonJS.
    files: ["**/*.config.js"],
    languageOptions: { sourceType: "commonjs", globals: globals.node },
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    // The store artwork scripts are plain node, and render.mjs evaluates code
    // inside the headless page it drives.
    files: ["**/*.mjs"],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    ...reactHooks.configs.flat.recommended,
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx"],
    rules: { "@typescript-eslint/no-non-null-assertion": "off" },
  }
);
