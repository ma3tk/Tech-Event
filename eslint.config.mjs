// Nx monorepo の root ESLint config (flat config)。
//
// puku0x/workspace-nx-devkit-storybook 構成を踏襲し、`@nx/eslint-plugin` の
// `enforce-module-boundaries` rule で scope / type タグの依存制約を強制する。
//
// - scope:web    → scope:web, scope:shared だけに依存可
// - scope:shared → scope:shared のみ
// - type:feature → 全 type を依存可
// - type:ui      → type:ui, type:util だけ依存可
// - type:data-access → type:util, type:data-access
// - type:util    → type:util だけ

import storybook from "eslint-plugin-storybook";
import nxPlugin from "@nx/eslint-plugin";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    ".nx/**",
    "node_modules/**",
    "next-env.d.ts",
    "**/.next/**",
    "apps/web/.next/**",
    "apps/web/next-env.d.ts",
    "apps/web/src/generated/**",
    "libs/shared/data-access-prisma/src/generated/**",
    "storybook-static/**",
    "**/storybook-static/**",
    "apps/web/storybook-static/**",
    "playwright-report/**",
    "**/playwright-report/**",
    "test-results/**",
    "**/test-results/**",
    "**/dist/**",
    "**/.nx/**",
  ]),
  // Nx の module boundary rule (TS/TSX のみに適用)。
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    plugins: { "@nx": nxPlugin },
    rules: {
      // Feature lib 切り出し PR で error に昇格。strict 運用。
      "@nx/enforce-module-boundaries": [
        "error",
        {
          enforceBuildableLibDependency: false,
          allow: ["^.*/eslint(\\.base)?\\.config\\.[cm]?js$"],
          depConstraints: [
            // scope 制約
            {
              sourceTag: "scope:web",
              onlyDependOnLibsWithTags: ["scope:web", "scope:shared"],
            },
            {
              sourceTag: "scope:shared",
              onlyDependOnLibsWithTags: ["scope:shared"],
            },
            // type 制約
            {
              sourceTag: "type:app",
              onlyDependOnLibsWithTags: [
                "type:feature",
                "type:ui",
                "type:data-access",
                "type:util",
              ],
            },
            {
              sourceTag: "type:feature",
              onlyDependOnLibsWithTags: [
                "type:feature",
                "type:ui",
                "type:data-access",
                "type:util",
              ],
            },
            {
              sourceTag: "type:ui",
              onlyDependOnLibsWithTags: ["type:ui", "type:util"],
            },
            {
              sourceTag: "type:data-access",
              onlyDependOnLibsWithTags: ["type:util", "type:data-access"],
            },
            {
              sourceTag: "type:util",
              onlyDependOnLibsWithTags: ["type:util"],
            },
            // type:e2e は app を implicit dep として持ち、shared lib も呼べる
            {
              sourceTag: "type:e2e",
              onlyDependOnLibsWithTags: [
                "type:app",
                "type:feature",
                "type:ui",
                "type:util",
                "type:data-access",
              ],
            },
          ],
        },
      ],
    },
  },
  ...storybook.configs["flat/recommended"],
]);

export default eslintConfig;
