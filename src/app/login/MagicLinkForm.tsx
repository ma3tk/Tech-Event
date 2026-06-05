"use client";

/**
 * Magic Link 入力フォーム (パスワードレスログイン)。
 *
 * - メールを `POST /api/auth/magic-link/request` に送信
 * - 成功時は確認メッセージを表示
 * - エラー時はインライン表示
 *
 * Luma の "Continue with Email" を参考にした最小フォーム。
 */

import { useState } from "react";

type Status = "idle" | "sending" | "sent" | "error";

export function MagicLinkForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setMessage(null);
    try {
      const res = await fetch("/api/auth/magic-link/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = (await res.json()) as { ok?: boolean; message?: string };
      if (res.ok && json.ok) {
        setStatus("sent");
        setMessage(json.message ?? "メールを送信しました");
      } else {
        setStatus("error");
        setMessage("メールアドレスが正しくありません。");
      }
    } catch {
      setStatus("error");
      setMessage("送信に失敗しました。時間をおいて再度お試しください。");
    }
  }

  return (
    <section aria-labelledby="magic-link-heading" data-testid="magic-link-section">
      <h2
        id="magic-link-heading"
        className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground"
      >
        Magic Link でログイン
      </h2>
      <form
        onSubmit={onSubmit}
        className="space-y-3"
        data-testid="magic-link-form"
      >
        <div>
          <label
            htmlFor="magic-link-email"
            className="block text-sm font-medium text-foreground"
          >
            メールアドレス
          </label>
          <input
            id="magic-link-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "sending"}
            data-testid="magic-link-email"
            className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-orange focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={status === "sending"}
          data-testid="magic-link-submit"
          className="w-full rounded-md bg-foreground py-2.5 text-sm font-semibold text-white shadow hover:opacity-90 disabled:opacity-60"
        >
          {status === "sending"
            ? "送信中..."
            : "メールアドレスでMagic Linkを受け取る"}
        </button>
      </form>
      {message && (
        <p
          role={status === "error" ? "alert" : "status"}
          aria-live="polite"
          data-testid="magic-link-message"
          className={
            status === "error"
              ? "mt-3 rounded-md border border-status-cancelled-bg bg-status-cancelled-bg/20 px-3 py-2 text-sm text-status-cancelled-fg"
              : "mt-3 rounded-md border border-brand-orange bg-brand-orange-soft px-3 py-2 text-sm text-foreground"
          }
        >
          {message}
        </p>
      )}
    </section>
  );
}
