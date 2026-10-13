import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["node_modules", "uploads"],
  },
  {
    files: ["src/**/*.js"],
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-undef": "error",
    },
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
  },
];
