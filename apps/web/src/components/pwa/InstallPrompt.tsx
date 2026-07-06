"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * `beforeinstallprompt` イベント (Chromium 系のみ発火) の型。
 * TypeScript の標準 lib には含まれないためローカルで定義する。
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

const DISMISS_KEY = "tech-event:pwa-install-dismissed";

/**
 * PWA インストール導線 (任意 mount)。
 *
 * - `beforeinstallprompt` を捕捉して deferred prompt を保持し、
 *   画面下部に小さなインストールバナーを表示する。
 * - 「あとで」を押すと localStorage に記録し、以後表示しない。
 * - イベントが発火しない環境 (iOS Safari / 既にインストール済み等) では
 *   何も描画しない。
 *
 * layout には mount していない (SW 登録とは独立した任意の導線)。
 * 使う場合は layout.tsx などに `<InstallPrompt />` を追加する。
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      // private mode 等で localStorage が使えない場合は表示を試みる
    }
    if (dismissed) return;

    const onBeforeInstallPrompt = (event: Event) => {
      // ブラウザ既定のミニバナーを抑止して自前導線に切り替える
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => setDeferredPrompt(null);

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    // 結果に関わらず prompt は一度しか使えないため破棄する
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // localStorage が使えなくてもセッション内では非表示にする
    }
    setDeferredPrompt(null);
  }, []);

  if (!deferredPrompt) return null;

  return (
    <div
      role="region"
      aria-label="アプリのインストール"
      data-testid="pwa-install-prompt"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-lg border border-border bg-surface p-3 shadow-lg sm:left-auto sm:right-4 sm:mx-0"
    >
      <p className="flex-1 text-sm text-foreground">
        tech-event をアプリとしてインストールできます
      </p>
      <button
        type="button"
        onClick={handleDismiss}
        className="shrink-0 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-brand-orange"
      >
        あとで
      </button>
      <button
        type="button"
        onClick={handleInstall}
        className="shrink-0 rounded-md bg-brand-orange px-3 py-1.5 text-sm font-medium text-brand-foreground hover:bg-brand-orange-hover focus-visible:outline-2 focus-visible:outline-brand-orange"
      >
        インストール
      </button>
    </div>
  );
}
