"use client";

/**
 * EventViewTracker — イベント詳細ページの閲覧 beacon 送信。
 *
 * イベント詳細ページ (`/event/[id]`) にマウントされ、初回表示時に
 * `/api/track/view` へ閲覧記録を 1 発 POST する。UI は描画しない (null)。
 *
 * 送信内容 (PII なし):
 * - eventId
 * - document.referrer (流入経路集計用。無ければ省略)
 * - URL の ?utm_source / ?utm_medium / ?utm_campaign
 *
 * 匿名セッション識別はサーバー側が `te_vid` cookie で行う
 * (無ければサーバーが発行する)。credentials: "same-origin" で cookie を同送。
 *
 * 二重送信抑制:
 * - sessionStorage (`te-viewed-{eventId}`) でタブ内の再送を抑止
 * - サーバー側でも同一 session × event の短時間再記録をデデュープ
 */
import { useEffect } from "react";

export default function EventViewTracker({
  eventId,
}: {
  eventId: string;
}): null {
  useEffect(() => {
    if (!eventId) return;

    // タブ (session) 内で同じイベントを再訪しても再送しない
    const storageKey = `te-viewed-${eventId}`;
    try {
      if (window.sessionStorage.getItem(storageKey)) return;
    } catch {
      // sessionStorage 不可 (プライベートモード等) でも beacon 自体は送る
    }

    const sp = new URLSearchParams(window.location.search);
    const payload: Record<string, string> = { eventId };

    const referrer = document.referrer;
    if (referrer) payload.referrer = referrer.slice(0, 500);

    const utmSource = sp.get("utm_source");
    if (utmSource) payload.utmSource = utmSource.slice(0, 100);
    const utmMedium = sp.get("utm_medium");
    if (utmMedium) payload.utmMedium = utmMedium.slice(0, 100);
    const utmCampaign = sp.get("utm_campaign");
    if (utmCampaign) payload.utmCampaign = utmCampaign.slice(0, 100);

    // fetch + keepalive: ページ離脱時にも送信が生き残る (sendBeacon 相当)。
    // 失敗しても UI には影響させない (fire-and-forget)。
    fetch("/api/track/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "same-origin",
      keepalive: true,
    })
      .then((res) => {
        if (res.ok) {
          try {
            window.sessionStorage.setItem(storageKey, "1");
          } catch {
            // noop
          }
        }
      })
      .catch(() => {
        // トラッキング失敗は無視 (閲覧体験を阻害しない)
      });
  }, [eventId]);

  return null;
}
