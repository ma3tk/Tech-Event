"use client";

/**
 * 公開URLを表示し、クリップボードへコピーできるボタン。
 *
 * SSR 時はホスト名が分からないので `path` を受け取り、マウント後に
 * `window.location.origin` を結合して URL を生成する。
 */
import { useEffect, useState } from "react";

export default function CopyUrlButton({ path }: { path: string }) {
  const [url, setUrl] = useState(path);
  const [copied, setCopied] = useState(false);

  // SSR ではホスト名 (origin) が不明。mount 後に window.location から URL を構築する。
  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR/CSR 境界の hydration
      setUrl(`${window.location.origin}${path}`);
    }
  }, [path]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // クリップボード API が使えない環境では select する
      const input = document.getElementById(
        "admin-copy-url-input",
      ) as HTMLInputElement | null;
      input?.select();
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input
        id="admin-copy-url-input"
        readOnly
        value={url}
        className="h-10 flex-1 rounded-md border border-border bg-background px-3 font-mono text-xs"
        data-testid="admin-more-public-url"
      />
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex h-10 items-center rounded-md bg-brand-orange px-4 text-sm font-semibold text-white hover:bg-brand-orange-hover"
        data-testid="admin-more-copy-url-button"
      >
        {copied ? "コピーしました" : "URLをコピー"}
      </button>
    </div>
  );
}
