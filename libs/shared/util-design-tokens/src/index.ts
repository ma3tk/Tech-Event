/**
 * `@tech-event/shared-util-design-tokens` — デザイントークンの JSON 一式。
 *
 * Figma Tokens Studio 互換形式で primitive / semantic.light / semantic.dark /
 * motion を保持する。`apps/web/scripts/sync-tokens.ts` が CSS と双方向同期する。
 *
 * このファイルは barrel re-export のみ。トークンは `./tokens/*.json` を参照。
 */
import primitive from "./tokens/primitive.json";
import semanticLight from "./tokens/semantic.light.json";
import semanticDark from "./tokens/semantic.dark.json";
import motion from "./tokens/motion.json";

export const tokens = {
  primitive,
  semanticLight,
  semanticDark,
  motion,
} as const;

export type DesignTokens = typeof tokens;
