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
      ".claude/**",
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // Expo's toolchain reads its config and config plugins as CommonJS.
    files: ["**/*.config.js", "apps/mobile/plugins/**/*.js"],
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
    // The app's TextInput tells the root tap observer a tap was on a text input, so moving
    // between inputs keeps the keyboard up; React Native's own would dismiss it.
    files: ["apps/mobile/**/*.ts", "apps/mobile/**/*.tsx"],
    ignores: [
      "apps/mobile/components/TextInput.tsx",
      "apps/mobile/**/*.test.ts",
      "apps/mobile/**/*.test.tsx",
      "apps/mobile/jest.setup.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react-native",
              importNames: ["TextInput"],
              message: "Use TextInput from apps/mobile/components/TextInput.",
            },
          ],
        },
      ],
    },
  },
  {
    // A screen the first-run wizard replaced its way to has nothing under it, where
    // router.back does nothing; goBack lands on Today instead.
    files: ["apps/mobile/**/*.ts", "apps/mobile/**/*.tsx"],
    ignores: ["apps/mobile/lib/goBack.ts", "apps/mobile/**/*.test.ts", "apps/mobile/**/*.test.tsx"],
    rules: {
      "no-restricted-properties": [
        "error",
        {
          object: "router",
          property: "back",
          message:
            "Use goBack from apps/mobile/lib/goBack, which lands on Today when nothing is under the screen.",
        },
      ],
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: [
      "packages/core/**",
      "packages/features/src/sessions/grades.ts",
      "packages/features/src/log-session/transforms.ts",
      "packages/features/src/gyms/transforms.ts",
      "packages/features/src/climbs/transforms.ts",
      "packages/features/src/climbs/log.ts",
      "packages/api/src/db/schema.ts",
      "packages/api/src/lib/export.ts",
      "packages/api/src/lib/gyms.ts",
      "packages/api/src/mcp/climbingSummary.ts",
      "**/*.test.ts",
      "**/*.test.tsx",
      "apps/mobile/features/training/data/renderWithHang.tsx",
      "apps/web/app/training/data/testHang.tsx",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/^(kg|lb)$/]",
          message:
            "Read the unit with useWeightUnit or the hang model and write weights with the formatters in hang/weights.ts; the units list is WEIGHT_UNITS.",
        },
        {
          selector:
            "ImportDeclaration[source.value='@sendtally/core'] ImportSpecifier[imported.name='formatGrade']",
          message:
            "Show grades with displayGrade, sessionGradeLabel, climbGradeLabel, gradeFormatter or draftGradeLabel, in the user's scales.",
        },
        {
          selector: "TemplateLiteral[quasis.0.value.raw='V'][expressions.length>0]",
          message: "Build grade labels with the formatters in sessions/grades.ts, never by hand.",
        },
      ],
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx"],
    rules: { "@typescript-eslint/no-non-null-assertion": "off" },
  }
);
