"use client";

/**
 * 既存の Server Component で組まれた `<nav role="tablist">` (URL クエリで tab を
 * 切り替える Link 集合) に対し、WAI-ARIA Authoring Practices 準拠のキーボード
 * 操作 (Arrow / Home / End) を後付けで追加する小さなクライアントヘルパ。
 *
 * 使い方:
 *
 *   <nav role="tablist" aria-label="...">
 *     <TablistKeyboard />  // 同じ親に置く (描画は何もしない)
 *     <Link role="tab" aria-selected="true" ...>...</Link>
 *     ...
 *   </nav>
 *
 *
 * 仕様 (ux-a11y.md Medium #38):
 *   - Arrow Left / Up   : 前のタブにフォーカス移動 (ループ)
 *   - Arrow Right / Down: 次のタブにフォーカス移動 (ループ)
 *   - Home              : 先頭のタブにフォーカス移動
 *   - End               : 末尾のタブにフォーカス移動
 *   - Tab               : tablist から抜ける (ブラウザ既定動作を温存)
 *
 * フォーカスのみで遷移は発生させない (Link 自身の Enter / クリックが遷移を担当)。
 * これにより既存の "URL = source of truth" 設計を壊さない。
 */
import { useEffect, useRef } from "react";

export default function TablistKeyboard() {
  const mountedRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const anchor = mountedRef.current;
    if (!anchor) return;
    const tablist = anchor.closest('[role="tablist"]') as HTMLElement | null;
    if (!tablist) return;

    function getTabs(): HTMLElement[] {
      if (!tablist) return [];
      return Array.from(
        tablist.querySelectorAll<HTMLElement>('[role="tab"]'),
      );
    }

    function onKeyDown(e: KeyboardEvent): void {
      const tabs = getTabs();
      if (tabs.length === 0) return;
      const active = document.activeElement as HTMLElement | null;
      const idx = active ? tabs.indexOf(active) : -1;

      let nextIdx = -1;
      switch (e.key) {
        case "ArrowLeft":
        case "ArrowUp":
          nextIdx = idx <= 0 ? tabs.length - 1 : idx - 1;
          break;
        case "ArrowRight":
        case "ArrowDown":
          nextIdx = idx === -1 ? 0 : (idx + 1) % tabs.length;
          break;
        case "Home":
          nextIdx = 0;
          break;
        case "End":
          nextIdx = tabs.length - 1;
          break;
        default:
          return;
      }
      if (nextIdx >= 0) {
        e.preventDefault();
        tabs[nextIdx]?.focus();
      }
    }

    tablist.addEventListener("keydown", onKeyDown);
    return () => {
      tablist.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // 親 tablist 要素を取得するためだけのアンカー (描画には影響しない)
  return (
    <span
      ref={mountedRef}
      aria-hidden="true"
      style={{ display: "none" }}
      data-tablist-keyboard
    />
  );
}
