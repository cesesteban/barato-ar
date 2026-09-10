import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const config = [
  ...compat.config({
    extends: ["next/core-web-vitals", "next/typescript"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
    },
  }),
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "specs/**",
      ".specify/**",
      ".claude/**",
      "*.dc.html",
      "precioya-wireframes.html",
      "prisma/migrations/**",
    ],
  },
];

export default config;
