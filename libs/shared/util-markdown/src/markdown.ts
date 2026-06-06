/**
 * Markdown → HTML 安全レンダラ。
 *
 * Issue: marked の出力は raw HTML を素通しするため、
 *   - 主催者 / ユーザ入力 (event description, group description, user bio, calendar description, comment 等)
 *   - を `dangerouslySetInnerHTML` で表示すると XSS の踏み台になる。
 *
 * 本ヘルパは:
 *   1. `marked.parse(text, { async: false })` で Markdown → HTML 変換
 *   2. `isomorphic-dompurify` で危険なタグ・属性をホワイトリスト sanitize
 *
 * - 呼び出し側は `renderMarkdown(text)` だけ呼び、結果を `dangerouslySetInnerHTML` に渡せばよい。
 * - 空文字 / null / undefined は空文字を返す。
 *
 * NOTE: `marked.setOptions({ gfm: true, breaks: true })` は呼び出し側 import タイミングで
 *   再設定される可能性があるが、ここでも保険として再設定する。
 */
import DOMPurify from "isomorphic-dompurify";
import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: true });

/** sanitize 設定 — 一般的な Markdown 出力のみ許可。 */
const SANITIZE_CONFIG = {
  USE_PROFILES: { html: true },
  // script / iframe / object / embed / form / input は完全に禁止
  FORBID_TAGS: [
    "script",
    "iframe",
    "object",
    "embed",
    "form",
    "input",
    "button",
    "select",
    "textarea",
    "style",
    "link",
    "meta",
    "base",
  ] as string[],
  // インラインイベントハンドラ / javascript: URI 系の属性を禁止
  FORBID_ATTR: [
    "onerror",
    "onload",
    "onclick",
    "onmouseover",
    "onmouseout",
    "onfocus",
    "onblur",
    "onkeydown",
    "onkeyup",
    "onkeypress",
    "onsubmit",
    "onchange",
    "onreset",
    "onselect",
    "onabort",
    "ondragstart",
    "ondrop",
    "formaction",
    "srcdoc",
  ] as string[],
};

/**
 * Markdown 文字列を安全な HTML に変換する。
 *
 * - 空入力は空文字を返す。
 * - `marked.parse` の例外は throw せず空文字を返す (UI を壊さない)。
 * - DOMPurify で sanitize 済みの文字列を返すので、そのまま
 *   `dangerouslySetInnerHTML` に渡してよい。
 */
export function renderMarkdown(text: string | null | undefined): string {
  if (!text) return "";
  let html: string;
  try {
    html = marked.parse(text, { async: false }) as string;
  } catch {
    return "";
  }
  return DOMPurify.sanitize(html, SANITIZE_CONFIG);
}

/**
 * JSON-LD などを `<script>` タグへ埋め込む際の文字列エスケープ。
 *
 * `</script>` の途中閉じや `<!--` でのコメント挿入を防ぐ。
 * `JSON.stringify` の結果に対して呼ぶ。
 */
export function escapeJsonForScript(json: string): string {
  return json
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/** JSON-LD オブジェクトを安全な文字列に変換する shortcut。 */
export function safeJsonLd(value: unknown): string {
  return escapeJsonForScript(JSON.stringify(value));
}
