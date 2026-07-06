"use client";

import { useEffect } from "react";

/**
 * Service Worker 登録用 Client Component。
 *
 * - **production ビルドのみ** 登録する (dev では Turbopack の HMR と SW の
 *   キャッシュが干渉し得るため登録しない)。
 * - `navigator.serviceWorker` 非対応ブラウザ / 非 secure context では何もしない。
 * - scope は `/` (sw.js が public 直下にあるため追加ヘッダ不要で全域をカバー)。
 * - UI は描画しない (return null)。layout.tsx に mount するだけで有効になる。
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((error: unknown) => {
          // 登録失敗はアプリ動作に影響しないため console にのみ残す
          console.warn("[pwa] Service Worker の登録に失敗しました:", error);
        });
    };

    // ページロード完了後に登録し、初回描画のリソース競合を避ける
    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
