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
 * 標準動作 (互換):
 *  - 半角/全角空白で split
 *  - 各トークンを `"..."` で quote (内部の `"` は `""` にエスケープ)
 *  - 全トークンを AND 結合 (デフォルト動作)
 *  - 空入力は null
 *
 * P2 拡張 (検索演算子):
 *  - `"phrase search"` (ダブルクォート) → フレーズ単位の完全一致
 *  - `term1 term2`                         → AND (デフォルト)
 *  - `term1 OR term2`                      → OR (大文字 OR のみ)
 *  - `-term` / `-"phrase"`                 → NOT (除外)
 *
 * 例:
 *   `AI 勉強会` → `"AI" AND "勉強会"`
 *   `"AI 勉強会"` → `"AI 勉強会"`
 *   `AI OR ML` → `"AI" OR "ML"`
 *   `AI -React` → `"AI" AND NOT "React"`
 */
export function normalizeFtsQuery(input: string): string | null {
  const tokens = tokenizeSearchQuery(input ?? "");
  if (tokens.length === 0) return null;
  return tokensToFtsExpr(tokens);
}

/* ============================================================
 * 検索演算子: トークナイザ
 *
 * トークン種別:
 *   - `term`   通常語 (AND の対象)
 *   - `phrase` ダブルクォートで囲まれた連語
 *   - `or`     大文字 OR (左右のトークンを OR 結合)
 *   - `not_*`  先頭 `-` で除外指定された term / phrase
 *
 * トークナイザは「FTS5 用」と「LIKE フォールバック用」の両方から参照する。
 * ============================================================ */

export type SearchToken =
  | { type: "term"; value: string }
  | { type: "phrase"; value: string }
  | { type: "or" }
  | { type: "not_term"; value: string }
  | { type: "not_phrase"; value: string };

/**
 * 検索文字列をトークン配列に分解する。
 *
 * - ダブルクォートはペアで認識 (閉じが無ければ通常語として処理)
 * - 大文字 `OR` を専用トークンに
 * - 先頭 `-` は NOT 修飾子。例: `-React`, `-"AI 勉強会"`
 */
export function tokenizeSearchQuery(input: string): SearchToken[] {
  const tokens: SearchToken[] = [];
  // 全角空白も区切りとして扱う
  const src = input.replace(/　/g, " ").trim();
  if (!src) return tokens;

  let i = 0;
  const len = src.length;
  while (i < len) {
    // 空白スキップ
    while (i < len && /\s/.test(src[i] ?? "")) i++;
    if (i >= len) break;

    let negate = false;
    if (src[i] === "-") {
      negate = true;
      i++;
      if (i >= len) break;
    }

    // フレーズ ("..."): 閉じが無ければ単語として扱う
    if (src[i] === '"') {
      const end = src.indexOf('"', i + 1);
      if (end > i) {
        const phrase = src.slice(i + 1, end);
        if (phrase.trim().length > 0) {
          tokens.push(
            negate
              ? { type: "not_phrase", value: phrase }
              : { type: "phrase", value: phrase },
          );
        }
        i = end + 1;
        continue;
      }
      // 閉じない → 残り全部を一語として扱う
      const rest = src.slice(i + 1).trim();
      if (rest.length > 0) {
        tokens.push(
          negate
            ? { type: "not_term", value: rest }
            : { type: "term", value: rest },
        );
      }
      break;
    }

    // 通常語 (空白まで)
    let end = i;
    while (end < len && !/\s/.test(src[end] ?? "") && src[end] !== '"') end++;
    const word = src.slice(i, end);
    i = end;
    if (!word) continue;
    if (word === "OR" && !negate) {
      tokens.push({ type: "or" });
      continue;
    }
    tokens.push(
      negate
        ? { type: "not_term", value: word }
        : { type: "term", value: word },
    );
  }
  return tokens;
}

/** トークン配列を FTS5 MATCH 式に変換する */
function tokensToFtsExpr(tokens: SearchToken[]): string | null {
  // 出力単位の積み上げ: positive (検索対象), negative (NOT 対象)
  // OR 演算は `tokenA OR tokenB` のように 2 項間に挟まる前提でスキャン
  const quoted = (v: string): string => `"${v.replace(/"/g, '""')}"`;

  // OR を挟まず NOT も含まないトークンを「リテラル群」として収集する。
  // 戻り値の式は (AND 連結) [NOT 連結] の混在を許容するが、最終的には
  // FTS5 の演算子 (`AND`, `OR`, `NOT`) を素直に並べる。
  type Atom = { sign: "+" | "-"; lit: string };
  const atoms: Atom[] = [];
  const orPositions = new Set<number>(); // atoms の index i-1 と i の間が OR

  for (const tk of tokens) {
    if (tk.type === "or") {
      // 直前の atom と次の atom を OR で結ぶ
      if (atoms.length > 0) orPositions.add(atoms.length); // 次に追加される atom
      continue;
    }
    let lit = "";
    let sign: "+" | "-" = "+";
    switch (tk.type) {
      case "term":
        lit = quoted(tk.value);
        break;
      case "phrase":
        lit = quoted(tk.value);
        break;
      case "not_term":
        lit = quoted(tk.value);
        sign = "-";
        break;
      case "not_phrase":
        lit = quoted(tk.value);
        sign = "-";
        break;
    }
    atoms.push({ sign, lit });
  }

  if (atoms.length === 0) return null;

  // 連結
  const parts: string[] = [];
  for (let i = 0; i < atoms.length; i++) {
    const a = atoms[i]!;
    if (i > 0) {
      if (orPositions.has(i)) {
        parts.push("OR");
      } else if (a.sign === "-") {
        parts.push("NOT");
      } else {
        parts.push("AND");
      }
    } else if (a.sign === "-") {
      // 先頭が NOT は FTS5 では成立しない → 「全件 NOT x」を表現するためダミー項を挟む。
      // FTS5 に "everything except X" の専用構文はないため、先頭から - を捨てて
      // 単語ヒットだけにする (現実的な妥協)。
      parts.push(a.lit);
      continue;
    }
    parts.push(a.lit);
  }

  return parts.join(" ");
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

  // LIKE フォールバック (検索演算子に対応)
  const where = buildLikeFallbackWhere(query);
  if (!where) return null;
  const rows = await prisma.event.findMany({
    where,
    select: { id: true },
    take: limit,
  });
  return rows.map((r) => r.id);
}

/**
 * LIKE フォールバック用の where 句を構築する。
 *
 * - `tokenizeSearchQuery` でトークン化した結果を Prisma の OR/AND/NOT に
 *   そのまま翻訳する。
 * - OR トークンは前後 2 項を `OR` 連結、それ以外は `AND`。
 * - NOT トークンは `NOT { OR: [...] }` で除外。
 * - 空クエリは null を返す。
 */
export function buildLikeFallbackWhere(
  query: string,
): Prisma.EventWhereInput | null {
  const tokens = tokenizeSearchQuery(query);
  if (tokens.length === 0) return null;

  const literalWhere = (
    value: string,
  ): Prisma.EventWhereInput => ({
    OR: [
      { title: { contains: value } },
      { catchPhrase: { contains: value } },
      { description: { contains: value } },
      { hashTag: { contains: value } },
      { place: { contains: value } },
    ],
  });

  type Atom = {
    sign: "+" | "-";
    where: Prisma.EventWhereInput;
  };
  const atoms: Atom[] = [];
  const orPositions = new Set<number>();
  for (const tk of tokens) {
    if (tk.type === "or") {
      if (atoms.length > 0) orPositions.add(atoms.length);
      continue;
    }
    switch (tk.type) {
      case "term":
      case "phrase":
        atoms.push({ sign: "+", where: literalWhere(tk.value) });
        break;
      case "not_term":
      case "not_phrase":
        atoms.push({ sign: "-", where: literalWhere(tk.value) });
        break;
    }
  }
  if (atoms.length === 0) return null;

  // 単純化: 「OR 群」 で先に分割し、各群を AND/NOT 結合 → 最後に OR でまとめる
  // 例:  A OR B C -D  →  groups = [[A], [B, C, -D]] → (A) OR (B AND C AND NOT D)
  const groups: Atom[][] = [[]];
  for (let i = 0; i < atoms.length; i++) {
    if (orPositions.has(i)) groups.push([]);
    groups[groups.length - 1]!.push(atoms[i]!);
  }

  const buildGroup = (
    group: Atom[],
  ): Prisma.EventWhereInput | null => {
    const positives = group.filter((a) => a.sign === "+").map((a) => a.where);
    const negatives = group.filter((a) => a.sign === "-").map((a) => a.where);
    const w: Prisma.EventWhereInput = {};
    if (positives.length > 0) {
      w.AND = positives;
    }
    if (negatives.length > 0) {
      // 「どの negative にもマッチしない」= NOT { OR: [...] }
      w.NOT = negatives;
    }
    if (positives.length === 0 && negatives.length === 0) return null;
    return w;
  };

  const groupWheres = groups
    .map(buildGroup)
    .filter((g): g is Prisma.EventWhereInput => g !== null);

  if (groupWheres.length === 0) return null;
  if (groupWheres.length === 1) return groupWheres[0]!;
  return { OR: groupWheres };
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
