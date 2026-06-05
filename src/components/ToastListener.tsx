/**
 * ToastListener
 *
 * URL の `?toast=<key>` 検索パラメータを監視し、ロード時に `sonner` の
 * `toast()` を発火させたうえで `toast` パラメータを URL から取り除く
 * クライアントコンポーネント。
 *
 * Server Action 側は `redirect("/path?toast=joined")` のように呼ぶか、
 * クライアントラッパ (`useActionToast`) が `router.replace` で
 * `?toast=...` を付与した URL に遷移するだけで通知を出せる。
 *
 * - URL に通知 key を載せる構造のため、リロード後に通知が二重に出ない
 *   ように、初回読み取り後にすぐ history から `toast` パラメータを除去する。
 * - 既知 key 以外は無視する。
 */
"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { toast } from "@/components/ui/toast";

type ToastKey =
  | "joined"
  | "cancelled"
  | "bookmarked"
  | "unbookmarked"
  | "comment-posted"
  | "group-created"
  | "calendar-created"
  | "saved";

const MESSAGES: Record<ToastKey, { type: "success" | "info"; text: string }> = {
  joined: { type: "success", text: "✓ 参加申込しました" },
  cancelled: { type: "info", text: "ℹ︎ 参加をキャンセルしました" },
  bookmarked: { type: "success", text: "♡ ブックマークしました" },
  unbookmarked: { type: "info", text: "ℹ︎ ブックマークを解除しました" },
  "comment-posted": { type: "success", text: "✓ コメント投稿しました" },
  "group-created": { type: "success", text: "✓ グループを作成しました" },
  "calendar-created": { type: "success", text: "✓ カレンダーを作成しました" },
  saved: { type: "success", text: "✓ 保存しました" },
};

function isToastKey(value: string): value is ToastKey {
  return Object.prototype.hasOwnProperty.call(MESSAGES, value);
}

export default function ToastListener(): React.ReactElement | null {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const lastShownRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const key = searchParams.get("toast");
    if (!key) return;
    if (!isToastKey(key)) return;
    // 同じ URL からの二重発火を防ぐ
    const fingerprint = `${pathname}?${key}`;
    if (lastShownRef.current === fingerprint) return;
    lastShownRef.current = fingerprint;

    const message = MESSAGES[key];
    if (message.type === "success") {
      toast.success(message.text);
    } else {
      toast.info(message.text);
    }

    // URL から `toast` パラメータを取り除く (リロード時に再発火させない)
    const params = new URLSearchParams(searchParams.toString());
    params.delete("toast");
    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [pathname, router, searchParams]);

  return null;
}
