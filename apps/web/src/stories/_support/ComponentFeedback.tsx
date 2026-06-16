/**
 * ComponentFeedback — Storybook 用フィードバック投稿ウィジェット。
 *
 * Gallery / 各 Docs ページで各コンポーネントの下に置き、評価 (1-5) + 任意コメントを
 * `/api/component-feedback` (Next.js) へ送信する。集計は /admin/component-feedback。
 *
 * Storybook は別オリジン (dev: localhost:6006 / 本番 Pages) で動くため、送信先の
 * Next アプリ URL は `apiBase` で指定する。既定は dev の `http://localhost:3000`。
 * 本番 Storybook から送る場合は `window.__TE_FEEDBACK_API_BASE__` を設定するか、
 * `apiBase` prop を渡す。
 *
 * 注: これは Storybook 専用の補助コンポーネント (アプリ本体では使わない)。
 */
import { useState } from "react";

export interface ComponentFeedbackProps {
  /** 対象コンポーネント名 (Storybook 表示名と一致させる)。 */
  component: string;
  /** 送信先 Next アプリの origin。既定 http://localhost:3000。 */
  apiBase?: string;
}

type Status = "idle" | "submitting" | "success" | "error";

function resolveApiBase(explicit?: string): string {
  if (explicit) return explicit;
  if (typeof window !== "undefined") {
    const g = (window as unknown as { __TE_FEEDBACK_API_BASE__?: string })
      .__TE_FEEDBACK_API_BASE__;
    if (g) return g;
  }
  return "http://localhost:3000";
}

const RATING_LABELS = ["", "悪い", "いまいち", "普通", "良い", "最高"] as const;

export function ComponentFeedback({
  component,
  apiBase,
}: ComponentFeedbackProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const active = hover || rating;

  async function submit() {
    if (rating < 1) {
      setStatus("error");
      setMessage("評価 (★) を選んでください。");
      return;
    }
    setStatus("submitting");
    setMessage("");
    try {
      const res = await fetch(
        `${resolveApiBase(apiBase)}/api/component-feedback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            component,
            rating,
            comment: comment.trim() || undefined,
            sourceUrl:
              typeof window !== "undefined" ? window.location.href : undefined,
          }),
        },
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
          error?: string;
        };
        throw new Error(body.message ?? body.error ?? `HTTP ${res.status}`);
      }
      setStatus("success");
      setMessage("フィードバックありがとうございます！");
      setRating(0);
      setComment("");
    } catch (e) {
      setStatus("error");
      setMessage(
        e instanceof Error
          ? `送信に失敗しました: ${e.message}`
          : "送信に失敗しました。",
      );
    }
  }

  if (status === "success") {
    return (
      <div
        data-testid="component-feedback"
        style={{
          marginTop: 8,
          padding: "10px 14px",
          borderRadius: 8,
          border: "1px solid var(--color-border, #e5e5e5)",
          background: "var(--color-status-open-bg, #f0fdf4)",
          color: "var(--color-status-open-fg, #166534)",
          fontSize: 13,
        }}
      >
        ✓ {message}{" "}
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setMessage("");
          }}
          style={{
            marginLeft: 8,
            textDecoration: "underline",
            color: "inherit",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          もう一度送る
        </button>
      </div>
    );
  }

  return (
    <form
      data-testid="component-feedback"
      data-component={component}
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      style={{
        marginTop: 8,
        padding: "10px 14px",
        borderRadius: 8,
        border: "1px solid var(--color-border, #e5e5e5)",
        background: "var(--color-surface-muted, #fafafa)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        fontSize: 13,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontWeight: 600 }}>
          {component} のフィードバック
        </span>
        <span aria-live="polite" style={{ opacity: 0.7 }}>
          {active ? RATING_LABELS[active] : "評価を選択"}
        </span>
      </div>

      <div role="radiogroup" aria-label={`${component} の評価`} style={{ display: "flex", gap: 2 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} / 5 (${RATING_LABELS[n]})`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 22,
              lineHeight: 1,
              padding: "0 2px",
              color: n <= active ? "#f59e0b" : "var(--color-border-strong, #cbd5e1)",
            }}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="改善点・気づいたこと (任意)"
        rows={2}
        maxLength={2000}
        style={{
          resize: "vertical",
          padding: "6px 8px",
          borderRadius: 6,
          border: "1px solid var(--color-border, #e5e5e5)",
          background: "var(--color-surface, #fff)",
          color: "var(--color-foreground, #111)",
          fontSize: 13,
          fontFamily: "inherit",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          type="submit"
          disabled={status === "submitting"}
          style={{
            padding: "6px 14px",
            borderRadius: 6,
            border: "none",
            background: "var(--color-brand-orange, #c2410c)",
            color: "#fff",
            fontWeight: 600,
            fontSize: 13,
            cursor: status === "submitting" ? "default" : "pointer",
            opacity: status === "submitting" ? 0.6 : 1,
          }}
        >
          {status === "submitting" ? "送信中…" : "送信"}
        </button>
        {message && (
          <span
            role={status === "error" ? "alert" : undefined}
            style={{
              color:
                status === "error"
                  ? "var(--color-status-closed-fg, #b91c1c)"
                  : "inherit",
            }}
          >
            {message}
          </span>
        )}
      </div>
    </form>
  );
}

export default ComponentFeedback;
