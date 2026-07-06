"use client";

/**
 * API キー管理ページ `/settings/api-keys`
 *
 * - 認証必須。未ログインは Server Action 側で /login にリダイレクト。
 * - 公開 API (`/api/v2/*`) 用のキーを発行 / 一覧 / 失効する。
 * - 生キー (`te_live_...`) は **発行直後にこの画面で 1 回だけ**表示する。
 *   再表示はできない (DB には sha256 ハッシュと prefix のみ保存)。
 * - Client Component: 発行結果 (生キー) をページ遷移なしで保持・表示するため。
 */

import { useCallback, useEffect, useState } from "react";

import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  type ApiKeySummary,
} from "@/app/actions/apikey-actions";
import Breadcrumb from "@/components/Breadcrumb";

/** ISO 文字列 → 日本語ローカル表記 (client-only なので hydration 差異なし) */
function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const SCOPE_LABELS: Record<string, string> = {
  read: "読み取り",
  write: "書き込み",
};

export default function ApiKeysSettingsPage() {
  const [keys, setKeys] = useState<ApiKeySummary[] | null>(null);
  const [name, setName] = useState("");
  const [writeScope, setWriteScope] = useState(false);
  const [issued, setIssued] = useState<{ name: string; rawKey: string } | null>(
    null,
  );
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const rows = await listApiKeys();
    setKeys(rows);
  }, []);

  useEffect(() => {
    // 未ログイン時は listApiKeys 内の redirect("/login?...") が働く。
    // Server Action (外部システム) からの初期ロードで、setState は
    // await 後の非同期コールバックでのみ呼ばれる (同期 setState ではない)。
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 外部データの初期フェッチ
    void reload().catch(() => {
      setError("API キー一覧の取得に失敗しました");
    });
  }, [reload]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setCopied(false);
    try {
      const scopes: ("read" | "write")[] = writeScope
        ? ["read", "write"]
        : ["read"];
      const res = await createApiKey({ name, scopes });
      // 生キーはこの state にのみ保持する (ログ・URL には出さない)
      setIssued({ name: res.key.name, rawKey: res.rawKey });
      setName("");
      setWriteScope(false);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "発行に失敗しました");
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await revokeApiKey(id);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "失効に失敗しました");
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    if (!issued) return;
    try {
      await navigator.clipboard.writeText(issued.rawKey);
      setCopied(true);
    } catch {
      // clipboard 未許可環境では選択コピーに任せる
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <Breadcrumb
        items={[
          { label: "ホーム", href: "/" },
          { label: "設定", href: "/settings/profile" },
          { label: "API キー" },
        ]}
      />
      <h1 className="mt-4 text-2xl font-bold">API キー</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        公開 API (<code>/api/v2/*</code>) にアクセスするためのキーを管理します。
        キーは <code>X-API-Key</code> ヘッダで送信してください。
      </p>

      {error && (
        <p
          role="alert"
          data-testid="api-key-error"
          className="mt-4 rounded-md border border-red-600 bg-surface px-3 py-2 text-sm text-red-600"
        >
          {error}
        </p>
      )}

      {/* ============ 発行フォーム ============ */}
      <form
        onSubmit={handleCreate}
        data-testid="api-key-create-form"
        className="mt-6 space-y-3 rounded-md border border-border bg-surface p-4"
      >
        <h2 className="text-sm font-bold">新しいキーを発行</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm">
            <span className="mb-1 block font-medium">キー名</span>
            <input
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: CI 用 / 社内ダッシュボード用"
              data-testid="api-key-name"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
            />
          </label>
          <label className="inline-flex h-10 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={writeScope}
              onChange={(e) => setWriteScope(e.target.checked)}
              data-testid="api-key-scope-write"
              className="h-4 w-4 accent-brand-orange"
            />
            書き込み (write) を許可
          </label>
          <button
            type="submit"
            disabled={busy || name.trim() === ""}
            data-testid="api-key-create-submit"
            className="inline-flex h-10 items-center rounded-md bg-brand-orange px-5 text-sm font-semibold text-white shadow hover:bg-brand-orange-hover disabled:opacity-50"
          >
            発行する
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          読み取り (read) スコープは常に付与されます。書き込みスコープはイベント作成
          / 参加者追加などの POST エンドポイントに必要です。
        </p>
      </form>

      {/* ============ 発行直後の生キー表示 (1 回だけ) ============ */}
      {issued && (
        <section
          aria-label="発行されたAPIキー"
          data-testid="api-key-issued"
          className="mt-4 rounded-md border border-brand-orange bg-brand-orange-soft p-4"
        >
          <p className="text-sm font-bold text-brand-orange">
            「{issued.name}」を発行しました
          </p>
          <p className="mt-1 text-xs text-foreground">
            以下のキーは<strong>今この画面でしか表示されません</strong>
            。安全な場所 (1Password 等のシークレット管理ツール) に保存してください。
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <code
              data-testid="api-key-raw"
              className="block flex-1 overflow-x-auto rounded-md border border-border bg-background px-3 py-2 font-mono text-xs"
            >
              {issued.rawKey}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              data-testid="api-key-copy"
              className="inline-flex h-9 shrink-0 items-center rounded-md border border-border bg-surface px-3 text-xs font-semibold hover:bg-background"
            >
              {copied ? "コピーしました" : "コピー"}
            </button>
            <button
              type="button"
              onClick={() => setIssued(null)}
              data-testid="api-key-dismiss"
              className="inline-flex h-9 shrink-0 items-center rounded-md border border-border bg-surface px-3 text-xs hover:bg-background"
            >
              閉じる
            </button>
          </div>
        </section>
      )}

      {/* ============ 一覧 ============ */}
      <h2 className="mt-8 text-lg font-bold">発行済みのキー</h2>
      {keys === null ? (
        <p className="mt-3 text-sm text-muted-foreground" data-testid="api-key-loading">
          読み込み中...
        </p>
      ) : keys.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground" data-testid="api-key-empty">
          発行済みの API キーはまだありません。
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-md border border-border bg-surface">
          <table className="w-full text-sm" data-testid="api-key-table">
            <thead className="border-b border-border bg-background text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">名前</th>
                <th className="px-3 py-2 text-left">キー</th>
                <th className="px-3 py-2 text-left">スコープ</th>
                <th className="px-3 py-2 text-left">最終使用</th>
                <th className="px-3 py-2 text-left">作成日</th>
                <th className="px-3 py-2 text-left">状態</th>
                <th className="px-3 py-2 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => {
                const revoked = k.revokedAt !== null;
                return (
                  <tr
                    key={k.id}
                    data-testid={`api-key-row-${k.id}`}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-3 py-3 font-medium text-foreground">
                      {k.name}
                    </td>
                    <td className="px-3 py-3">
                      <code
                        className="font-mono text-xs"
                        data-testid={`api-key-prefix-${k.id}`}
                      >
                        {k.prefix}…
                      </code>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {k.scopes.map((s) => SCOPE_LABELS[s] ?? s).join(" / ")}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {k.lastUsedAt ? formatDateTime(k.lastUsedAt) : "未使用"}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {formatDateTime(k.createdAt)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        data-testid={`api-key-status-${k.id}`}
                        className={
                          revoked
                            ? "text-xs text-muted-foreground"
                            : "text-xs font-semibold text-brand-orange"
                        }
                      >
                        {revoked ? "失効済み" : "有効"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      {!revoked && (
                        <button
                          type="button"
                          onClick={() => void handleRevoke(k.id)}
                          disabled={busy}
                          data-testid={`api-key-revoke-${k.id}`}
                          className="inline-flex h-8 items-center rounded-md border border-red-600 px-3 text-xs font-semibold text-red-600 hover:bg-surface disabled:opacity-50"
                        >
                          失効
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        失効したキーは即座に API アクセスできなくなります (復元はできません)。
      </p>
    </div>
  );
}
