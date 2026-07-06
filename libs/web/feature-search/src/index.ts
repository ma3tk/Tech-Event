/**
 * `@tech-event/web-feature-search` — 検索 (FTS + 演算子) + タグフォロー機能。
 *
 * - `./lib/search`             : FTS5 全文検索 + 検索演算子
 * - `./lib/tags`               : タグ読み取りヘルパー (関連タグ / サジェスト / フォロー状態)
 * - `./lib/tag-follow-actions` : タグフォロー / 解除の Server Actions
 */
export * from "./lib/search";
export * from "./lib/tags";
export * from "./lib/tag-follow-actions";
