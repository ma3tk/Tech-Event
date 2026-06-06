/**
 * `@tech-event/shared-util-markdown` — Markdown → HTML 安全レンダラ群。
 *
 * `renderMarkdown(text)` で marked + DOMPurify を通した sanitize 済み HTML を返す。
 * 主催者 / ユーザ入力 (event description, group description, comment 等) を
 * `dangerouslySetInnerHTML` で安全に表示するために利用する。
 */
export * from "./markdown";
