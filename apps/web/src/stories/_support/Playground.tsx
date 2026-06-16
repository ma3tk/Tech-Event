/**
 * Playground — クリックして要素をその場で編集し、リアルタイムに反映する
 * インタラクティブなコンポーネント実験場 (Storybook 専用)。
 *
 * - 上部タブでコンポーネントを選択 (Button / Badge / Input / TagPill / EventStatusBadge)。
 * - プレビュー内のラベルは **クリックで直接編集** (contentEditable)。入力は即反映。
 * - 右のインスペクタで variant / size / boolean / number を変更 → リアルタイム反映。
 * - 現在の編集状態は **localStorage に保存** されリロードしても復元 (単一ユーザー前提)。
 * - 下部に現在の JSX を生成表示 (コピーして実装に転記できる)。
 */
import { useEffect, useMemo, useRef, useState } from "react";

import { Button, Badge, Input } from "@tech-event/shared-ui";
// composite の barrel (`@tech-event/shared-ui-composite`) は `export *` で
// prisma 依存の component まで取り込み、Storybook (ブラウザ) で壊れる。
// そのため各 component をエイリアス経由で個別 import する
// (TagPill / EventStatusBadge は default export、EVENT_STATUSES は named)。
import TagPill from "@/components/TagPill";
import EventStatusBadge, {
  EVENT_STATUSES,
} from "@/components/EventStatusBadge";

type PropMap = Record<string, string | number | boolean>;

type Control =
  | { kind: "enum"; key: string; label: string; options: readonly string[] }
  | { kind: "bool"; key: string; label: string }
  | { kind: "text"; key: string; label: string }
  | { kind: "number"; key: string; label: string; min?: number; max?: number };

interface CompDef {
  id: string;
  label: string;
  /** 既定の props。 */
  defaults: PropMap;
  /** インスペクタに出すコントロール。 */
  controls: Control[];
  /** クリック編集対象のテキスト prop (無ければ undefined)。 */
  textKey?: string;
  /** プレビュー描画。`label` はクリック編集可能なテキスト要素。 */
  render: (props: PropMap, label: React.ReactNode) => React.ReactNode;
}

const BUTTON_VARIANTS = [
  "default",
  "secondary",
  "destructive",
  "outline",
  "ghost",
  "link",
] as const;
const BUTTON_SIZES = ["xs", "sm", "md", "lg"] as const;
const BADGE_VARIANTS = [
  "default",
  "secondary",
  "destructive",
  "outline",
  "success",
  "warning",
  "info",
] as const;

const COMPONENTS: CompDef[] = [
  {
    id: "Button",
    label: "Button",
    defaults: { children: "ボタン", variant: "default", size: "md", disabled: false },
    textKey: "children",
    controls: [
      { kind: "enum", key: "variant", label: "variant", options: BUTTON_VARIANTS },
      { kind: "enum", key: "size", label: "size", options: BUTTON_SIZES },
      { kind: "bool", key: "disabled", label: "disabled" },
      { kind: "text", key: "children", label: "text" },
    ],
    render: (p, label) => (
      <Button
        variant={p.variant as (typeof BUTTON_VARIANTS)[number]}
        size={p.size as (typeof BUTTON_SIZES)[number]}
        disabled={Boolean(p.disabled)}
      >
        {label}
      </Button>
    ),
  },
  {
    id: "Badge",
    label: "Badge",
    defaults: { children: "ラベル", variant: "default" },
    textKey: "children",
    controls: [
      { kind: "enum", key: "variant", label: "variant", options: BADGE_VARIANTS },
      { kind: "text", key: "children", label: "text" },
    ],
    render: (p, label) => (
      <Badge variant={p.variant as (typeof BADGE_VARIANTS)[number]}>{label}</Badge>
    ),
  },
  {
    id: "Input",
    label: "Input",
    defaults: { placeholder: "入力してください", disabled: false, value: "" },
    controls: [
      { kind: "text", key: "placeholder", label: "placeholder" },
      { kind: "bool", key: "disabled", label: "disabled" },
    ],
    render: (p) => (
      <div style={{ width: 260 }}>
        <Input
          placeholder={String(p.placeholder ?? "")}
          disabled={Boolean(p.disabled)}
        />
      </div>
    ),
  },
  {
    id: "TagPill",
    label: "TagPill",
    // TagPill は `label` prop でテキストを描画し children を無視するため、
    // inline contentEditable は使わずインスペクタの text フィールドで編集する。
    defaults: { label: "TypeScript", count: 0, removable: false },
    controls: [
      { kind: "text", key: "label", label: "label" },
      { kind: "number", key: "count", label: "count", min: 0, max: 999 },
      { kind: "bool", key: "removable", label: "removable" },
    ],
    render: (p) => (
      <TagPill
        label={String(p.label ?? "")}
        count={Number(p.count) || undefined}
        removable={Boolean(p.removable)}
      />
    ),
  },
  {
    id: "EventStatusBadge",
    label: "EventStatusBadge",
    defaults: { status: "open", variant: "subtle", size: "md" },
    controls: [
      { kind: "enum", key: "status", label: "status", options: EVENT_STATUSES },
      {
        kind: "enum",
        key: "variant",
        label: "variant",
        options: ["subtle", "solid", "outline", "dot"],
      },
      { kind: "enum", key: "size", label: "size", options: ["sm", "md", "lg"] },
    ],
    render: (p) => (
      <EventStatusBadge
        status={p.status as (typeof EVENT_STATUSES)[number]}
        variant={p.variant as "subtle" | "solid" | "outline" | "dot"}
        size={p.size as "sm" | "md" | "lg"}
      />
    ),
  },
];

const STORAGE_KEY = "te-playground-state-v1";

/** クリックで直接編集できるテキスト (contentEditable, uncontrolled で caret 維持)。 */
function EditableText({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  // マウント (= key 変化での再マウント) 時のみ初期値を流し込む。
  // 以後は onInput でのみ親 state を更新し、value を child に戻さないことで
  // 入力中の caret ジャンプを防ぐ。
  useEffect(() => {
    if (ref.current && ref.current.textContent !== value) {
      ref.current.textContent = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <span
      ref={ref}
      role="textbox"
      tabIndex={0}
      aria-label="クリックして編集"
      contentEditable
      suppressContentEditableWarning
      onInput={(e) => onChange(e.currentTarget.textContent ?? "")}
      title="クリックして編集"
      style={{ outline: "none", cursor: "text", borderRadius: 3 }}
    />
  );
}

function loadState(): Record<string, PropMap> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, PropMap>) : {};
  } catch {
    return {};
  }
}

export function Playground() {
  const [selected, setSelected] = useState(COMPONENTS[0]!.id);
  // localStorage から復元 (lazy initializer。Storybook は client 描画なので安全)。
  const [store, setStore] = useState<Record<string, PropMap>>(() => loadState());
  // 再マウント用のキー (reset でテキストを再シードする)。
  const [resetNonce, setResetNonce] = useState(0);

  const def = COMPONENTS.find((c) => c.id === selected)!;
  const props: PropMap = useMemo(
    () => ({ ...def.defaults, ...(store[selected] ?? {}) }),
    [def, store, selected],
  );

  function update(key: string, val: string | number | boolean) {
    setStore((prev) => {
      const next = {
        ...prev,
        [selected]: { ...def.defaults, ...(prev[selected] ?? {}), [key]: val },
      };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore quota errors */
      }
      return next;
    });
  }

  function reset() {
    setStore((prev) => {
      const next = { ...prev };
      delete next[selected];
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
    setResetNonce((n) => n + 1);
  }

  const label = def.textKey ? (
    <EditableText
      key={`${selected}-${def.textKey}-${resetNonce}`}
      value={String(props[def.textKey] ?? "")}
      onChange={(v) => update(def.textKey!, v)}
    />
  ) : null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 280px",
        gap: 16,
        alignItems: "start",
        fontSize: 14,
      }}
    >
      {/* ===== 左: タブ + プレビュー + コード ===== */}
      <div>
        <div role="tablist" aria-label="コンポーネント" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {COMPONENTS.map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={c.id === selected}
              onClick={() => setSelected(c.id)}
              style={{
                padding: "5px 12px",
                borderRadius: 999,
                border: "1px solid var(--color-border, #e5e5e5)",
                background:
                  c.id === selected
                    ? "var(--color-brand-orange, #c2410c)"
                    : "var(--color-surface, #fff)",
                color: c.id === selected ? "#fff" : "var(--color-foreground, #111)",
                fontWeight: c.id === selected ? 700 : 500,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 160,
            padding: 24,
            borderRadius: 12,
            border: "1px dashed var(--color-border-strong, #cbd5e1)",
            background: "var(--color-surface, #fff)",
          }}
        >
          {def.render(props, label)}
        </div>

        {def.textKey && (
          <p style={{ marginTop: 8, fontSize: 12, color: "var(--color-muted-foreground, #6b7280)" }}>
            💡 プレビュー内の文字を <strong>クリックして直接編集</strong>できます。変更は即反映され、状態は自動保存されます。
          </p>
        )}

        <pre
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 8,
            background: "var(--color-surface-muted, #0f172a0a)",
            color: "var(--color-foreground, #111)",
            fontSize: 12,
            overflowX: "auto",
            border: "1px solid var(--color-border, #e5e5e5)",
          }}
        >
          <code>{toJsx(def, props)}</code>
        </pre>
      </div>

      {/* ===== 右: インスペクタ ===== */}
      <aside
        style={{
          padding: 14,
          borderRadius: 12,
          border: "1px solid var(--color-border, #e5e5e5)",
          background: "var(--color-surface-muted, #fafafa)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <strong>{def.label} の props</strong>
          <button
            type="button"
            onClick={reset}
            style={{
              fontSize: 12,
              textDecoration: "underline",
              background: "none",
              border: "none",
              color: "var(--color-link, #005d8c)",
              cursor: "pointer",
            }}
          >
            リセット
          </button>
        </div>

        {def.controls.map((ctrl) => (
          <div key={ctrl.key} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-muted-foreground, #6b7280)" }}>
              {ctrl.label}
            </label>

            {ctrl.kind === "enum" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {ctrl.options.map((opt) => {
                  const on = String(props[ctrl.key]) === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => update(ctrl.key, opt)}
                      style={{
                        padding: "3px 8px",
                        borderRadius: 6,
                        fontSize: 12,
                        cursor: "pointer",
                        border: "1px solid var(--color-border, #e5e5e5)",
                        background: on ? "var(--color-brand-orange-soft, #fff0e6)" : "var(--color-surface, #fff)",
                        color: on ? "var(--color-brand-orange, #c2410c)" : "var(--color-foreground, #111)",
                        fontWeight: on ? 700 : 400,
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {ctrl.kind === "bool" && (
              <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={Boolean(props[ctrl.key])}
                  onChange={(e) => update(ctrl.key, e.target.checked)}
                />
                {Boolean(props[ctrl.key]) ? "true" : "false"}
              </label>
            )}

            {ctrl.kind === "text" && (
              <input
                type="text"
                value={String(props[ctrl.key] ?? "")}
                onChange={(e) => update(ctrl.key, e.target.value)}
                style={{
                  padding: "5px 8px",
                  borderRadius: 6,
                  border: "1px solid var(--color-border, #e5e5e5)",
                  background: "var(--color-surface, #fff)",
                  fontSize: 13,
                }}
              />
            )}

            {ctrl.kind === "number" && (
              <input
                type="number"
                min={ctrl.min}
                max={ctrl.max}
                value={Number(props[ctrl.key]) || 0}
                onChange={(e) => update(ctrl.key, Number(e.target.value))}
                style={{
                  padding: "5px 8px",
                  borderRadius: 6,
                  border: "1px solid var(--color-border, #e5e5e5)",
                  background: "var(--color-surface, #fff)",
                  fontSize: 13,
                  width: 90,
                }}
              />
            )}
          </div>
        ))}
      </aside>
    </div>
  );
}

/** 現在の props から JSX 文字列を生成する。 */
function toJsx(def: CompDef, props: PropMap): string {
  const attrs: string[] = [];
  let children = "";
  for (const ctrl of def.controls) {
    const v = props[ctrl.key];
    if (ctrl.key === def.textKey) {
      children = String(v ?? "");
      continue;
    }
    if (ctrl.kind === "bool") {
      if (v) attrs.push(ctrl.key);
    } else if (ctrl.kind === "number") {
      if (Number(v)) attrs.push(`${ctrl.key}={${Number(v)}}`);
    } else if (v !== "" && v != null) {
      attrs.push(`${ctrl.key}="${String(v)}"`);
    }
  }
  // textKey が children でないコンポーネント (TagPill の label 等) は属性で表現。
  if (def.textKey && def.textKey !== "children") {
    children = "";
  }
  const attrStr = attrs.length ? " " + attrs.join(" ") : "";
  return children
    ? `<${def.id}${attrStr}>${children}</${def.id}>`
    : `<${def.id}${attrStr} />`;
}

export default Playground;
