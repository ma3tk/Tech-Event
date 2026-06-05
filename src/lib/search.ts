/**
 * SQLite FTS5 を使った全文検索ヘルパー。
 *
 * - `searchEvents(query, options)` がメイン API。FTS5 仮想テーブル `events_fts` に
 *   問い合わせ、event id 配列を返す。`options.where` で追加条件 (status / 期間など)
 *   を `events` 本体に絞り込める。
 * - FTS5 が利用不可な SQLite ビルドでは、自動的に LIKE フォールバックに切り替わる。
 *   その際は **1 度だけ** console.warn する。
 *
 * クエリは "Python", "Python TypeScript" (AND), `"Next.js"` (PHRASE) など FTS5 の
 * 標準シンタックスをそのまま受け付ける。サニタイズとして MATCH の特殊文字を
 * 安全にエスケープし、空クエリは null を返す。
 *
 * 既存の `prisma.event.findMany({ where: { OR: [...] } })` 完全互換にするため、
 * FTS で得た id 集合を `id: { in: [...] }` として戻すユーティリティ
 * `applyFtsWhere(query, where)` も用意する。
 */

import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

let _ftsAvailable: boolean | null = null;
let _ftsWarned = false;

/**
 * FTS5 仮想テーブル `events_fts` が存在するか確認 (キャッシュ付き)。
 * SQLite ビルドに FTS5 が無い、もしくは migration がまだ流れていない場合 false。
 */
export async function isFtsAvailable(): Promise<boolean> {
  if (_ftsAvailable !== null) return _ftsAvailable;
  try {
    const rows = await prisma.$queryRawUnsafe<{ name: string }[]>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='events_fts' LIMIT 1",
    );
    _ftsAvailable = Array.isArray(rows) && rows.length > 0;
  } catch {
    _ftsAvailable = false;
  }
  if (!_ftsAvailable && !_ftsWarned) {
    _ftsWarned = true;
    console.warn(
      "[search] FTS5 未対応もしくは events_fts 不在のため LIKE フォールバックを使用します。",
    );
  }
  return _ftsAvailable;
}

/**
 * 任意入力文字列を FTS5 の MATCH 句に安全に渡せる形に整形する。
 *
 * 規則:
 *  - 半角/全角空白で split
 *  - 各トークンを `"..."` で quote (内部の `"` は `""` にエスケープ)
 *  - 全トークンを AND 結合 (デフォルト動作)
 *  - 空入力は null
 */
export function normalizeFtsQuery(input: string): string | null {
  const trimmed = input?.trim();
  if (!trimmed) return null;
  // 改行/全角空白も含めて分割
  const tokens = trimmed
    .split(/[\s　]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .map((t) => `"${t.replace(/"/g, '""')}"`);
  if (tokens.length === 0) return null;
  return tokens.join(" AND ");
}

export interface SearchOptions {
  /** 取得件数上限 (デフォルト 500: where 句で更に絞り込み前提) */
  limit?: number;
}

/**
 * FTS5 (もしくは LIKE フォールバック) で event id 配列を返す。
 * 該当なしは空配列、空クエリは null (= 「全件対象」をシグナル) を返す。
 */
export async function searchEvents(
  query: string,
  options: SearchOptions = {},
): Promise<bigint[] | null> {
  const matchExpr = normalizeFtsQuery(query);
  if (!matchExpr) return null;
  const limit = options.limit ?? 500;

  if (await isFtsAvailable()) {
    try {
      const rows = await prisma.$queryRawUnsafe<{ rowid: bigint | number }[]>(
        // bm25 でランキングして上位を返す
        `SELECT rowid FROM events_fts WHERE events_fts MATCH ? ORDER BY bm25(events_fts) LIMIT ?`,
        matchExpr,
        limit,
      );
      return rows.map((r) =>
        typeof r.rowid === "bigint" ? r.rowid : BigInt(r.rowid),
      );
    } catch (err) {
      // 例えば不正なクエリは MATCH でエラーになりうる。
      // フォールバックに切り替えて続行する。
      if (!_ftsWarned) {
        _ftsWarned = true;
        console.warn(
          `[search] FTS5 MATCH に失敗したため LIKE フォールバックします: ${(err as Error).message}`,
        );
      }
    }
  }

  // LIKE フォールバック
  const tokens = query
    .trim()
    .split(/[\s　]+/)
    .filter((t) => t.length > 0);
  const where: Prisma.EventWhereInput = {
    AND: tokens.map(
      (t): Prisma.EventWhereInput => ({
        OR: [
          { title: { contains: t } },
          { catchPhrase: { contains: t } },
          { description: { contains: t } },
          { hashTag: { contains: t } },
          { place: { contains: t } },
        ],
      }),
    ),
  };
  const rows = await prisma.event.findMany({
    where,
    select: { id: true },
    take: limit,
  });
  return rows.map((r) => r.id);
}

/**
 * Prisma の where 句に FTS 検索結果を AND 合成するヘルパー。
 *
 * 戻り値:
 *  - `query` が空: 渡された where をそのまま返す (= 全件対象)
 *  - FTS ヒット 0: `{ id: { in: [] }, ...where }` で必ず空集合
 *  - FTS ヒットあり: `{ id: { in: [...] }, ...where }`
 */
export async function applyFtsWhere(
  query: string,
  where: Prisma.EventWhereInput,
  options: SearchOptions = {},
): Promise<Prisma.EventWhereInput> {
  const ids = await searchEvents(query, options);
  if (ids === null) return where;
  return { ...where, id: { in: ids } };
}

/**
 * 検索語ハイライト用 util。HTML エスケープしたうえで対象語を `<mark>` で囲む。
 * Server Component で `dangerouslySetInnerHTML` に渡す前提。
 *
 * 注: 単純な部分一致ベース。日本語形態素は考慮していない。
 */
export function highlightText(text: string, query: string): string {
  const escaped = escapeHtml(text);
  const tokens = (query ?? "")
    .trim()
    .split(/[\s　]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  if (tokens.length === 0) return escaped;
  // 長い順にマッチさせると入れ子の取り違えを減らせる
  tokens.sort((a, b) => b.length - a.length);
  const pattern = new RegExp(
    `(${tokens.map((t) => escapeRegex(t)).join("|")})`,
    "gi",
  );
  return escaped.replace(pattern, '<mark class="bg-brand-orange-soft">$1</mark>');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * テスト/ホットリロード用に内部キャッシュ状態をクリアする。
 */
export function resetSearchCacheForTesting(): void {
  _ftsAvailable = null;
  _ftsWarned = false;
}
