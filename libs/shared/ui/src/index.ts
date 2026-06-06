/**
 * `@tech-event/shared-ui` — shadcn/ui スタイルの ui レイヤ (primitive コンポーネント群)。
 *
 * Radix UI + CVA primitives 24 個。shadcn/ui 公式 (https://ui.shadcn.com/) の "ui" 分類に相当。
 * Composite (Header / EventCard など) は `@tech-event/shared-ui-composite` 側 (= components 分類) に分離。
 *
 * 分類規約: `docs/component-classification.md` 参照。
 * このファイルは barrel re-export のみ。各 module 内で副作用を持たないこと。
 */
export * from "./avatar";
export * from "./badge";
export * from "./button";
export * from "./card";
export * from "./checkbox";
export * from "./dialog";
export * from "./dropdown-menu";
export * from "./empty-state";
export * from "./error-state";
export * from "./form";
export * from "./input";
export * from "./label";
export * from "./loading-state";
export * from "./popover";
export * from "./radio-group";
export * from "./select";
export * from "./separator";
export * from "./sheet";
export * from "./skeleton";
export * from "./switch";
export * from "./tabs";
export * from "./textarea";
export * from "./toast";
export * from "./tooltip";
