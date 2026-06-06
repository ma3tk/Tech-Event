/**
 * `EventSource` で `/api/notifications/stream` に接続し、新規通知が来たら
 * - Header のベルバッジ未読数を increment する (CustomEvent で broadcast)
 * - sonner の toast を発火する
 *
 * 切断時は exponential backoff で 1.5s → 3s → 6s ... と再接続する (上限 30s)。
 *
 * 利用側 (`Header.tsx` 等):
 * ```tsx
 * useNotificationStream({ enabled: !!user })
 * ```
 *
 * 注意:
 *  - EventSource は Server Component から使えないため、必ず Client Component で呼ぶ。
 *  - 同一タブで複数回 mount しないこと (重複接続を避ける)。Header 1 箇所のみが理想。
 *  - SSE は polling ベースの軽量実装なので、本番では Redis pub/sub などへの置き換えを検討する。
 */
"use client";

import { useEffect, useRef } from "react";

import { toast } from "@/components/ui/toast";
import {
  formatNotificationText,
  parseNotificationPayload,
} from "../lib/notification";

/**
 * Header (ベルバッジ) に未読数の最新値を反映するための CustomEvent 名。
 *
 * `Header.tsx` は mount 時に `window.addEventListener` で購読しておく。
 */
export const NOTIFICATION_UNREAD_EVENT = "tech-event:notification-unread";

export interface NotificationStreamMessage {
  id: string;
  kind: string;
  eventId: string | null;
  payload: string;
  createdAt: string;
  unreadCount: number;
}

export interface UseNotificationStreamOptions {
  /** SSE 接続を有効にするか (= ログイン済みのとき true) */
  enabled: boolean;
  /** 既定 `/api/notifications/stream`。テストで上書き可能。 */
  url?: string;
  /** 新規通知到達時のカスタムハンドラ (テスト用) */
  onMessage?: (msg: NotificationStreamMessage) => void;
}

/**
 * unreadCount を Header ベル等に届ける。
 *
 * `window.dispatchEvent(new CustomEvent(NOTIFICATION_UNREAD_EVENT, { detail: { unreadCount }}))`
 */
export function dispatchUnreadCount(unreadCount: number): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(NOTIFICATION_UNREAD_EVENT, {
      detail: { unreadCount },
    }),
  );
}

export function useNotificationStream(
  opts: UseNotificationStreamOptions,
): void {
  const { enabled, url = "/api/notifications/stream", onMessage } = opts;
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef<number>(1500);
  const closedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    if (typeof EventSource === "undefined") return;
    // E2E (Playwright) では SSE による長時間接続が `networkidle` 待ちと衝突して
    // 他テストを timeout させるため、以下の順序で判定する:
    //   1. `?sse=force` (または cookie `tech_event_force_sse=1`) → 必ず接続 (SSE E2E 用)
    //   2. `?sse=off` (または cookie `tech_event_disable_sse=1`) → disable
    //   3. User-Agent に "HeadlessChrome" を含む → disable (Playwright デフォルト)
    //   4. それ以外 → connect
    try {
      const params = new URLSearchParams(window.location.search);
      const force =
        params.get("sse") === "force" ||
        document.cookie.includes("tech_event_force_sse=1");
      if (!force) {
        if (params.get("sse") === "off") return;
        if (document.cookie.includes("tech_event_disable_sse=1")) return;
        if (/HeadlessChrome/i.test(navigator.userAgent)) return;
      }
    } catch {
      /* ignore */
    }

    closedRef.current = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const connect = (): void => {
      try {
        const es = new EventSource(url, { withCredentials: true });
        esRef.current = es;

        es.addEventListener("connected", (e) => {
          retryRef.current = 1500; // reset backoff
          try {
            const data = JSON.parse((e as MessageEvent).data ?? "{}") as {
              unreadCount?: number;
            };
            if (typeof data.unreadCount === "number") {
              dispatchUnreadCount(data.unreadCount);
            }
          } catch {
            /* ignore */
          }
        });

        es.addEventListener("new-notification", (e) => {
          try {
            const raw = (e as MessageEvent).data ?? "{}";
            const data = JSON.parse(raw) as NotificationStreamMessage;
            // バッジ更新
            if (typeof data.unreadCount === "number") {
              dispatchUnreadCount(data.unreadCount);
            }
            // toast 通知
            const payload = parseNotificationPayload(data.payload ?? "");
            const text = formatNotificationText(data.kind, payload);
            toast.info(text);
            // 任意のハンドラ
            onMessage?.(data);
          } catch {
            /* ignore parse error */
          }
        });

        es.addEventListener("ping", () => {
          // keep-alive。何もしない。
        });

        es.onerror = (): void => {
          // EventSource はネイティブ実装の自動再接続もあるが、
          // バックエンドが 401 を返したケースなどで暴走しないよう、
          // 自前で close → backoff してから再接続する。
          try {
            es.close();
          } catch {
            /* ignore */
          }
          esRef.current = null;
          if (closedRef.current) return;
          const wait = retryRef.current;
          retryRef.current = Math.min(retryRef.current * 2, 30_000);
          timer = setTimeout(() => {
            if (!closedRef.current) connect();
          }, wait);
        };
      } catch {
        // EventSource 構築自体に失敗 (test 環境など) — 何もしない
      }
    };

    connect();

    return () => {
      closedRef.current = true;
      if (timer) clearTimeout(timer);
      try {
        esRef.current?.close();
      } catch {
        /* ignore */
      }
      esRef.current = null;
    };
  }, [enabled, url, onMessage]);
}
