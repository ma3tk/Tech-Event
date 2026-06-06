"use client";

/**
 * MarkdownEditor — 2 カラム WYSIWYG Markdown エディタ
 *
 * Luma の create-event ページ / connpass のリッチエディタを参考にした、
 * 「左: textarea, 右: ライブプレビュー」「ツールバー付き」のシンプルなエディタ。
 *
 * - props: `name`, `defaultValue`, `label`, `rows`
 * - Uncontrolled component として動作し、内部 state を `value` で持つ。
 *   `name` 属性を持つ <textarea> を実 DOM に置くため form submit でそのまま送信される。
 * - ツールバー: 太字 / 斜体 / 見出し / リスト / リンク / 画像 / コード / 引用
 *   textarea の選択範囲にマークダウンを挿入する (`document.execCommand` を使わず、
 *   `setRangeText` + 手動 value 更新で React の controlled モデルを尊重)。
 * - モバイル (<= sm) では「編集」「プレビュー」のタブ切り替え (Radix Tabs ベース)
 * - 文字数カウントを下部に表示
 * - プレビューは marked で描画 (既存 prose スタイルを再利用)
 *
 * 内部実装: ツールバーボタンは `ui/Button` (variant=ghost / size=sm)、
 * 編集領域は `ui/Textarea` (border-0 で見た目維持)、モバイルタブは `ui/Tabs`。
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { cn } from "@tech-event/shared-util-cn";
import { renderMarkdown } from "@tech-event/shared-util-markdown";
import { Button } from "@tech-event/shared-ui";
import { Textarea } from "@tech-event/shared-ui";
import { Tabs, TabsList, TabsTrigger } from "@tech-event/shared-ui";

export type MarkdownEditorProps = {
  /** form submit 時の name 属性 */
  name: string;
  /** uncontrolled の初期値 */
  defaultValue?: string;
  /** aria-label / 表示ラベル (任意) */
  label?: string;
  /** textarea の rows (高さ目安) */
  rows?: number;
  /** placeholder */
  placeholder?: string;
  /** form 送信に乗せる最大文字数。HTML 側にも maxLength を適用する */
  maxLength?: number;
  /** id (label との関連付け用) */
  id?: string;
  /** デバッグ用 data-testid プレフィックス */
  testIdPrefix?: string;
};

type ToolbarAction =
  | "bold"
  | "italic"
  | "heading"
  | "list"
  | "link"
  | "image"
  | "code"
  | "quote";

type Mode = "edit" | "preview";

/**
 * 選択範囲を Markdown で囲む / 行頭に prefix を付ける。
 * 戻り値: 新しい value / 選択範囲を再設定するための [start, end]。
 */
function applyMarkdown(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  action: ToolbarAction,
): { next: string; cursorStart: number; cursorEnd: number } {
  const before = text.slice(0, selectionStart);
  const selected = text.slice(selectionStart, selectionEnd);
  const after = text.slice(selectionEnd);

  switch (action) {
    case "bold": {
      const inner = selected || "太字";
      const wrapped = `**${inner}**`;
      return {
        next: before + wrapped + after,
        cursorStart: before.length + 2,
        cursorEnd: before.length + 2 + inner.length,
      };
    }
    case "italic": {
      const inner = selected || "斜体";
      const wrapped = `*${inner}*`;
      return {
        next: before + wrapped + after,
        cursorStart: before.length + 1,
        cursorEnd: before.length + 1 + inner.length,
      };
    }
    case "heading": {
      // 行頭に "## " を追加
      const inner = selected || "見出し";
      const wrapped = `\n## ${inner}\n`;
      return {
        next: before + wrapped + after,
        cursorStart: before.length + 4,
        cursorEnd: before.length + 4 + inner.length,
      };
    }
    case "list": {
      const inner = selected || "項目";
      // 複数行に分解して各行頭に - を付与
      const lines = inner.split("\n").map((l) => `- ${l}`);
      const wrapped = `\n${lines.join("\n")}\n`;
      return {
        next: before + wrapped + after,
        cursorStart: before.length + 3,
        cursorEnd: before.length + 3 + inner.length,
      };
    }
    case "link": {
      const inner = selected || "リンクテキスト";
      const wrapped = `[${inner}](https://)`;
      return {
        next: before + wrapped + after,
        cursorStart: before.length + 1,
        cursorEnd: before.length + 1 + inner.length,
      };
    }
    case "image": {
      const inner = selected || "alt";
      const wrapped = `![${inner}](https://)`;
      return {
        next: before + wrapped + after,
        cursorStart: before.length + 2,
        cursorEnd: before.length + 2 + inner.length,
      };
    }
    case "code": {
      const inner = selected || "code";
      // 選択範囲に改行が含まれていればコードブロック、なければインラインコード
      if (inner.includes("\n")) {
        const wrapped = `\n\`\`\`\n${inner}\n\`\`\`\n`;
        return {
          next: before + wrapped + after,
          cursorStart: before.length + 5,
          cursorEnd: before.length + 5 + inner.length,
        };
      }
      const wrapped = `\`${inner}\``;
      return {
        next: before + wrapped + after,
        cursorStart: before.length + 1,
        cursorEnd: before.length + 1 + inner.length,
      };
    }
    case "quote": {
      const inner = selected || "引用";
      const lines = inner.split("\n").map((l) => `> ${l}`);
      const wrapped = `\n${lines.join("\n")}\n`;
      return {
        next: before + wrapped + after,
        cursorStart: before.length + 3,
        cursorEnd: before.length + 3 + inner.length,
      };
    }
  }
}

export default function MarkdownEditor({
  name,
  defaultValue = "",
  label,
  rows = 12,
  placeholder,
  maxLength = 50_000,
  id,
  testIdPrefix = "markdown-editor",
}: MarkdownEditorProps): React.JSX.Element {
  const [value, setValue] = useState<string>(defaultValue);
  const [mode, setMode] = useState<Mode>("edit");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const editorId = id ?? `markdown-editor-${name}`;

  // プレビュー用 HTML (marked → DOMPurify でサニタイズ)
  const html = useMemo<string>(() => {
    if (!value) return "";
    return renderMarkdown(value);
  }, [value]);

  // フォーカスを textarea に戻したいときに使うフラグ
  const refocusRef = useRef<{ start: number; end: number } | null>(null);

  useEffect(() => {
    const refocus = refocusRef.current;
    if (refocus && textareaRef.current) {
      const ta = textareaRef.current;
      ta.focus();
      ta.setSelectionRange(refocus.start, refocus.end);
      refocusRef.current = null;
    }
  }, [value]);

  const handleAction = useCallback(
    (action: ToolbarAction) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const { next, cursorStart, cursorEnd } = applyMarkdown(
        value,
        start,
        end,
        action,
      );
      refocusRef.current = { start: cursorStart, end: cursorEnd };
      setValue(next.slice(0, maxLength));
    },
    [value, maxLength],
  );

  const previewStyle: CSSProperties = {
    minHeight: `${Math.max(rows, 6) * 1.5}rem`,
  };

  return (
    <div
      className="rounded-md border border-border bg-white"
      data-testid={`${testIdPrefix}-root`}
    >
      {label && (
        <label
          htmlFor={editorId}
          className="block border-b border-border px-3 py-2 text-xs font-medium text-muted-foreground"
        >
          {label}
        </label>
      )}

      {/* ============ ツールバー ============ */}
      <div
        className="flex flex-wrap items-center gap-1 border-b border-border bg-surface px-2 py-1.5"
        role="toolbar"
        aria-label="Markdown ツールバー"
        data-testid={`${testIdPrefix}-toolbar`}
      >
        <ToolbarBtn
          onClick={() => handleAction("bold")}
          title="太字 (Ctrl+B)"
          testId={`${testIdPrefix}-btn-bold`}
        >
          <span className="font-bold">B</span>
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => handleAction("italic")}
          title="斜体 (Ctrl+I)"
          testId={`${testIdPrefix}-btn-italic`}
        >
          <span className="italic">I</span>
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => handleAction("heading")}
          title="見出し"
          testId={`${testIdPrefix}-btn-heading`}
        >
          H2
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => handleAction("list")}
          title="リスト"
          testId={`${testIdPrefix}-btn-list`}
        >
          • 一覧
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => handleAction("link")}
          title="リンク"
          testId={`${testIdPrefix}-btn-link`}
        >
          🔗
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => handleAction("image")}
          title="画像"
          testId={`${testIdPrefix}-btn-image`}
        >
          🖼
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => handleAction("code")}
          title="コード"
          testId={`${testIdPrefix}-btn-code`}
        >
          {"</>"}
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => handleAction("quote")}
          title="引用"
          testId={`${testIdPrefix}-btn-quote`}
        >
          ❝
        </ToolbarBtn>

        {/* モバイル用タブ (sm 以下で表示)。ui/Tabs (Radix) で role="tablist" /
            "tab" / aria-selected を自動で付与。 */}
        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as Mode)}
          className="ml-auto sm:hidden"
        >
          <TabsList
            aria-label="表示切替"
            // 旧スタイル: h は約 h-8、bg は無し → ui/TabsList の bg-background/p-1 を消す
            className="h-8 bg-transparent p-0 gap-1"
          >
            <TabsTrigger
              value="edit"
              data-testid={`${testIdPrefix}-tab-edit`}
              className={cn(
                "h-8 rounded border border-border bg-white px-3 text-xs text-foreground",
                "data-[state=active]:bg-brand-orange data-[state=active]:text-white",
                "data-[state=active]:border-brand-orange data-[state=active]:font-semibold",
                "data-[state=active]:shadow-none",
              )}
            >
              編集
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              data-testid={`${testIdPrefix}-tab-preview`}
              className={cn(
                "h-8 rounded border border-border bg-white px-3 text-xs text-foreground",
                "data-[state=active]:bg-brand-orange data-[state=active]:text-white",
                "data-[state=active]:border-brand-orange data-[state=active]:font-semibold",
                "data-[state=active]:shadow-none",
              )}
            >
              プレビュー
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* ============ エディタ本体 (2 カラム / モバイルはタブ) ============ */}
      <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
        <div
          className={`border-r border-border sm:block ${mode === "edit" ? "block" : "hidden"}`}
        >
          {/* ui/Textarea の rounded/border/min-h を一旦リセットしてエディタ枠に
              合わせる (枠は親 div 側に集約)。focus-visible のリングも消す。 */}
          <Textarea
            ref={textareaRef}
            id={editorId}
            name={name}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={rows}
            maxLength={maxLength}
            placeholder={placeholder ?? "Markdown で記述..."}
            data-testid={`${testIdPrefix}-textarea`}
            className={cn(
              "block w-full resize-y bg-white px-3 py-2 font-mono text-sm",
              "rounded-none border-0 min-h-0",
              "focus-visible:ring-0 focus-visible:outline-none",
            )}
            aria-label={label ? `${label} (Markdown 編集)` : "Markdown 編集"}
          />
        </div>

        <div
          className={`bg-surface sm:block ${mode === "preview" ? "block" : "hidden"}`}
          aria-live="polite"
          aria-label="プレビュー"
          data-testid={`${testIdPrefix}-preview`}
        >
          <div
            className="prose prose-sm max-w-none px-3 py-2"
            style={previewStyle}
            // renderMarkdown 内で DOMPurify sanitize 済み
            dangerouslySetInnerHTML={{
              __html: html || `<p class="text-muted-foreground text-sm">プレビューがここに表示されます</p>`,
            }}
          />
        </div>
      </div>

      {/* ============ 文字数カウント ============ */}
      <div
        className="flex items-center justify-between border-t border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground"
        data-testid={`${testIdPrefix}-footer`}
      >
        <span>Markdown (GFM) 対応</span>
        <span data-testid={`${testIdPrefix}-count`}>
          {new Intl.NumberFormat("ja-JP").format(value.length)} / {new Intl.NumberFormat("ja-JP").format(maxLength)} 文字
        </span>
      </div>
    </div>
  );
}

/**
 * ツールバーボタン。
 * `ui/Button` (variant=ghost / size=sm) をベースに、エディタ独自の
 * 「hover で border が出る」スタイルを上書き。
 */
function ToolbarBtn({
  onClick,
  title,
  testId,
  children,
}: {
  onClick: () => void;
  title: string;
  testId: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      data-testid={testId}
      variant="ghost"
      size="sm"
      className={cn(
        "h-8 min-w-[2rem] px-2 text-sm text-foreground",
        "border border-transparent hover:border-border hover:bg-white",
      )}
    >
      {children}
    </Button>
  );
}
