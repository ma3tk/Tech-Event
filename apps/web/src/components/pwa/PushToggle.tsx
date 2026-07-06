"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Web Push 購読トグル (`/settings/notifications` に配置)。
 *
 * - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` 未設定なら「未対応」表示 (無効ボタン)。
 *   実配信の有効化は `pnpm add web-push` + VAPID env 設定のみで完結する
 *   (サーバ側は `sendWebPush` が dynamic import + フォールバック済み)。
 * - 有効化フロー:
 *     1. `Notification.requestPermission()`
 *     2. `registration.pushManager.subscribe({ applicationServerKey })`
 *     3. 購読 JSON を `POST /api/push/subscribe` へ保存
 * - 解除フロー: `subscription.unsubscribe()` → `POST /api/push/unsubscribe`
 *
 * NOTE: Service Worker (`/sw.js`) の登録は `ServiceWorkerRegister` が担当
 * (production のみ)。SW 未登録の環境では「このブラウザでは利用できません」
 * 扱いになる。
 */

/** ビルド時に inline される公開鍵 (サーバの VAPID_PUBLIC_KEY と同値を設定する) */
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

type PushToggleStatus =
  /** VAPID 公開鍵が未設定 (サーバ側も未構成) */
  | "unconfigured"
  /** ブラウザが Push API / SW 非対応、または SW 未登録 */
  | "unsupported"
  /** 通知許可がユーザーによって拒否済み */
  | "denied"
  /** 購読状態の確認中 */
  | "checking"
  /** 未購読 (有効化できる) */
  | "unsubscribed"
  /** 購読済み */
  | "subscribed"
  /** 購読/解除の処理中 */
  | "working";

/** base64url 形式の VAPID 公開鍵を `applicationServerKey` 用に変換する。 */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  // `applicationServerKey` は `BufferSource` (= ArrayBuffer 背景) を要求するため
  // 明示的に ArrayBuffer から生成する (SharedArrayBuffer 型混入を避ける)
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export default function PushToggle() {
  const configured = VAPID_PUBLIC_KEY.length > 0;
  const [status, setStatus] = useState<PushToggleStatus>(
    configured ? "checking" : "unconfigured",
  );
  const [error, setError] = useState<string | null>(null);

  // マウント時に現在の購読状態を確認する
  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    void (async () => {
      if (!isPushSupported()) {
        if (!cancelled) setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setStatus("denied");
        return;
      }
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) {
          // SW 未登録 (dev モード等)。購読はできないので未対応扱い。
          if (!cancelled) setStatus("unsupported");
          return;
        }
        const subscription = await registration.pushManager.getSubscription();
        if (!cancelled) {
          setStatus(subscription ? "subscribed" : "unsubscribed");
        }
      } catch {
        if (!cancelled) setStatus("unsupported");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [configured]);

  const handleSubscribe = useCallback(async () => {
    setError(null);
    setStatus("working");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "unsubscribed");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!res.ok) {
        // サーバ保存に失敗したらブラウザ側の購読も戻す
        await subscription.unsubscribe().catch(() => undefined);
        throw new Error(`subscribe failed (${res.status})`);
      }
      setStatus("subscribed");
    } catch {
      setError("プッシュ通知の有効化に失敗しました。");
      setStatus("unsubscribed");
    }
  }, []);

  const handleUnsubscribe = useCallback(async () => {
    setError(null);
    setStatus("working");
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription =
        (await registration?.pushManager.getSubscription()) ?? null;
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        });
      }
      setStatus("unsubscribed");
    } catch {
      setError("プッシュ通知の解除に失敗しました。");
      setStatus("subscribed");
    }
  }, []);

  const subscribed = status === "subscribed";
  const actionable = status === "subscribed" || status === "unsubscribed";

  let statusText: string;
  switch (status) {
    case "unconfigured":
      statusText =
        "未対応 (サーバ側のプッシュ通知設定が未構成のため利用できません)";
      break;
    case "unsupported":
      statusText = "このブラウザでは利用できません";
      break;
    case "denied":
      statusText =
        "通知がブロックされています。ブラウザの設定から許可してください";
      break;
    case "checking":
      statusText = "購読状態を確認しています…";
      break;
    case "working":
      statusText = "処理中…";
      break;
    case "subscribed":
      statusText = "このブラウザでプッシュ通知を受信します";
      break;
    case "unsubscribed":
    default:
      statusText = "プッシュ通知は無効です";
      break;
  }

  return (
    <section
      aria-labelledby="push-toggle-heading"
      data-testid="push-toggle-section"
      className="mt-6 rounded-md border border-border bg-surface p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="push-toggle-heading" className="text-sm font-bold">
            ブラウザのプッシュ通知
          </h2>
          <p
            className="mt-1 text-xs text-muted-foreground"
            data-testid={
              status === "unconfigured" || status === "unsupported"
                ? "push-toggle-unavailable"
                : "push-toggle-status"
            }
          >
            {statusText}
          </p>
          {error && (
            <p role="alert" className="mt-1 text-xs text-danger">
              {error}
            </p>
          )}
        </div>
        <button
          type="button"
          data-testid="push-toggle"
          disabled={!actionable}
          aria-pressed={subscribed}
          onClick={subscribed ? handleUnsubscribe : handleSubscribe}
          className={
            subscribed
              ? "inline-flex h-9 items-center rounded-md border border-border px-4 text-sm font-medium text-foreground hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
              : "inline-flex h-9 items-center rounded-md bg-brand-orange px-4 text-sm font-semibold text-white hover:bg-brand-orange-hover disabled:cursor-not-allowed disabled:opacity-50"
          }
        >
          {subscribed ? "プッシュ通知を解除" : "プッシュ通知を有効化"}
        </button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        上の表の「プッシュ」列は通知種類ごとの受信設定です。ここではこのブラウザ
        (端末) で受信するかどうかを切り替えます。
      </p>
    </section>
  );
}
