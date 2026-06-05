/**
 * 検索演算子のヒントを表示するモーダル。
 *
 * - explore ページに常時マウントされ、`/` (slash) または `?` で開く。
 * - ESC / overlay クリックで閉じる。
 *
 * 演算子 (`src/lib/search.ts` の `tokenizeSearchQuery` 参照):
 *   - "..." (フレーズ)
 *   - term1 term2 (AND)
 *   - term1 OR term2 (OR)
 *   - -term (NOT)
 */
"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { HelpCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

const HINTS: { syntax: string; desc: string; example: string }[] = [
  {
    syntax: '"フレーズ"',
    desc: "ダブルクォートで囲むと完全一致 (フレーズ検索)",
    example: '"AI 勉強会"',
  },
  {
    syntax: "term1 term2",
    desc: "スペース区切りは AND 検索 (両方を含む)",
    example: "AI Python",
  },
  {
    syntax: "term1 OR term2",
    desc: "大文字 OR で OR 検索 (どちらかを含む)",
    example: "React OR Vue",
  },
  {
    syntax: "-term",
    desc: "先頭にマイナスで除外 (NOT)",
    example: "AI -React",
  },
];

export default function SearchHintsModal(): React.JSX.Element {
  const [open, setOpen] = useState(false);

  // `/` または `?` キーで開く (入力中は除外)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onKey = (e: KeyboardEvent): void => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isEditable =
        tag === "input" || tag === "textarea" || target?.isContentEditable;
      if (isEditable) return;
      if (e.key === "?" || (e.key === "/" && !e.metaKey && !e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          data-testid="search-hints-trigger"
          aria-label="検索のヒント"
          className="inline-flex h-9 items-center gap-1 rounded-md border border-border bg-background px-3 text-xs text-muted-foreground hover:bg-brand-orange-soft"
        >
          <HelpCircle aria-hidden className="h-4 w-4" />
          検索のヒント
          <kbd className="ml-1 hidden rounded border border-border bg-surface px-1 text-[10px] md:inline">
            /
          </kbd>
        </button>
      </DialogTrigger>
      <DialogContent data-testid="search-hints-modal" className="max-w-md">
        <DialogHeader>
          <DialogTitle>検索のヒント</DialogTitle>
          <DialogDescription>
            キーワード欄では以下の演算子が使えます。
          </DialogDescription>
        </DialogHeader>
        <ul className="mt-3 flex flex-col gap-3 text-sm">
          {HINTS.map((h) => (
            <li
              key={h.syntax}
              className="rounded border border-border bg-surface p-3"
              data-testid="search-hints-row"
            >
              <p className="font-mono text-xs text-brand-orange">{h.syntax}</p>
              <p className="mt-1 text-foreground">{h.desc}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                例: <span className="font-mono">{h.example}</span>
              </p>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
