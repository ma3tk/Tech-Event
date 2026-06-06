/**
 * 人気イベントランキング
 *
 * URL: `/ranking?ym=YYYYMM`
 *
 * - 月単位で acceptedCount の降順上位 50 件
 * - `ym` 省略時は当月
 * - 月選択 UI (過去 12 ヶ月 + 当月)
 * - 各行は `<EventListRow showRank={n}>` で表示 (1〜3 位は金/銀/銅バッジ)
 */

import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toEventCardData } from "@/lib/event-card";
import EventListRow from "@/components/EventListRow";
import { cn } from "@/lib/cn";
import {
  DEFAULT_LOCALE,
  SITE_NAME,
  absoluteUrl,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

const RANKING_TITLE = "人気ランキング";
const RANKING_DESCRIPTION =
  "月別の人気IT勉強会・カンファレンスをランキング形式でチェックできます。";

export const metadata: Metadata = {
  title: RANKING_TITLE,
  description: RANKING_DESCRIPTION,
  alternates: {
    canonical: absoluteUrl("/ranking"),
  },
  openGraph: {
    title: RANKING_TITLE,
    description: RANKING_DESCRIPTION,
    url: absoluteUrl("/ranking"),
    siteName: SITE_NAME,
    locale: DEFAULT_LOCALE,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: RANKING_TITLE,
    description: RANKING_DESCRIPTION,
  },
};

const TAKE = 50;

type SearchParams = Promise<{ ym?: string }>;

/**
 * `YYYYMM` をパースして [start, end) を返す。フォーマット不正の場合は当月。
 */
function parseYm(input: string | undefined): {
  ym: string;
  start: Date;
  end: Date;
  label: string;
} {
  let y: number;
  let m: number;
  if (input && /^\d{6}$/.test(input)) {
    y = Number(input.slice(0, 4));
    m = Number(input.slice(4, 6));
  } else {
    const now = new Date();
    y = now.getFullYear();
    m = now.getMonth() + 1;
  }
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);
  const ym = `${y}${String(m).padStart(2, "0")}`;
  const label = `${y}年${m}月`;
  return { ym, start, end, label };
}

/**
 * 月選択 UI 用の選択肢を生成。当月 + 過去 11 ヶ月。
 */
function buildMonthOptions(): { ym: string; label: string }[] {
  const out: { ym: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    out.push({
      ym: `${y}${String(m).padStart(2, "0")}`,
      label: `${y}年${m}月`,
    });
  }
  return out;
}

export default async function RankingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const { ym, start, end, label } = parseYm(sp.ym);
  const months = buildMonthOptions();

  const rows = await prisma.event.findMany({
    where: {
      status: "published",
      visibility: "public",
      startedAt: { gte: start, lt: end },
    },
    orderBy: [{ acceptedCount: "desc" }, { startedAt: "asc" }],
    take: TAKE,
    include: {
      group: true,
      tags: { include: { tag: true } },
    },
  });

  const events = rows.map((e, i) => ({
    rank: i + 1,
    card: toEventCardData(e),
  }));

  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="mx-auto w-full max-w-4xl px-4 py-6">
        <h1 className="text-xl font-bold sm:text-2xl">人気イベントランキング</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {label} の参加申込数 (確定枠) 上位 {TAKE} 件
        </p>

        {/* ============ 月選択 ============ */}
        <nav className="mt-4 flex flex-wrap gap-2">
          {months.map((m) => (
            <Link
              key={m.ym}
              href={`/ranking?ym=${m.ym}`}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-medium",
                m.ym === ym
                  ? "border-brand-orange bg-brand-orange text-white"
                  : "border-border bg-surface text-muted-foreground hover:bg-zinc-50",
              )}
            >
              {m.label}
            </Link>
          ))}
        </nav>

        {/* ============ ランキング (コンパクト行) ============ */}
        {events.length === 0 ? (
          <div className="mt-8 rounded-md border border-border bg-surface p-12 text-center text-sm text-muted-foreground">
            この月に公開されたイベントはありません。
          </div>
        ) : (
          <ol className="mt-6 divide-y divide-border rounded-md border border-border bg-surface">
            {events.map((entry) => (
              <li key={entry.card.id}>
                <EventListRow event={entry.card} showRank={entry.rank} />
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
