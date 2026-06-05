import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

export type PaginationProps = {
  currentPage: number;
  totalPages: number;
  /** 現在ページの前後に表示するページ数 */
  siblingCount?: number;
  /** 先頭/末尾に表示するページ数 */
  boundaryCount?: number;
  /**
   * ページ番号からリンク URL を組み立てる関数。
   * `baseUrl` から自動生成する場合は省略可。
   */
  buildHref?: (page: number) => string;
  /**
   * ベース URL (クエリパラメータを含む)。`?page=N` を組み立てる際に利用。
   * 例: `/explore?keyword=react` → `/explore?keyword=react&page=2`
   */
  baseUrl?: string;
  /** `<nav aria-label>` の上書き */
  ariaLabel?: string;
  className?: string;
};

/**
 * 大量ページに対する数値ページャー。
 * 現在ページ周辺と先頭/末尾を表示し、間は `…` で省略する。
 */
export function computePages(
  current: number,
  total: number,
  sibling = 1,
  boundary = 1,
): Array<number | "ellipsis"> {
  const range: Array<number | "ellipsis"> = [];
  const left = Math.max(current - sibling, boundary + 1);
  const right = Math.min(current + sibling, total - boundary);

  for (let i = 1; i <= Math.min(boundary, total); i++) range.push(i);
  if (left > boundary + 1) range.push("ellipsis");
  for (let i = left; i <= right; i++) {
    if (i > boundary && i <= total - boundary) range.push(i);
  }
  if (right < total - boundary) range.push("ellipsis");
  for (let i = Math.max(total - boundary + 1, boundary + 1); i <= total; i++) {
    range.push(i);
  }
  return range;
}

/**
 * 数値ベースのページネーション。
 *
 * - `baseUrl` を渡すと `?page=N` を自動付与
 * - `buildHref` を渡すと URL 組み立てを完全に上書き
 * - `totalPages <= 1` なら何も描画しない (`null`)
 *
 * 内部の前へ/次へボタン、ページ番号ボタンは `ui/Button` の `asChild` パターンで
 * `<Link>` を直接スタイルする。disabled / current ページは `<span>` で
 * `role="link"` を付与し、aria-disabled / aria-current で状態を伝える。
 */
export default function Pagination({
  currentPage,
  totalPages,
  siblingCount = 1,
  boundaryCount = 1,
  buildHref,
  baseUrl,
  ariaLabel = "ページネーション",
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const hrefFor = (page: number): string => {
    if (buildHref) return buildHref(page);
    if (baseUrl) return appendPageParam(baseUrl, page);
    return `?page=${page}`;
  };

  const range = computePages(
    currentPage,
    totalPages,
    siblingCount,
    boundaryCount,
  );
  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;

  return (
    <nav
      aria-label={ariaLabel}
      className={cn("flex justify-center py-6", className)}
    >
      <ul className="flex items-center gap-1">
        <li>
          <PageLink
            href={hrefFor(currentPage - 1)}
            disabled={prevDisabled}
            ariaLabel="前のページに移動"
          >
            <ChevronLeft aria-hidden="true" className="h-4 w-4 rtl-flip" />
            <span className="hidden sm:inline ms-1">前へ</span>
          </PageLink>
        </li>

        {range.map((p, i) =>
          p === "ellipsis" ? (
            <li
              key={`e-${i}`}
              aria-hidden="true"
              className="px-2 text-muted select-none"
            >
              …
            </li>
          ) : (
            <li key={p} className="hidden sm:list-item">
              <PageLink
                href={hrefFor(p)}
                isCurrent={p === currentPage}
                ariaLabel={
                  p === currentPage
                    ? `現在のページ、${p}ページ目`
                    : `${p}ページ目に移動`
                }
              >
                {p}
              </PageLink>
            </li>
          ),
        )}

        {/* モバイル: 現在/総数 */}
        <li className="sm:hidden px-3 text-sm text-muted-foreground">
          <span
            role="link"
            aria-current="page"
            aria-label={`現在のページ、${currentPage} / ${totalPages}`}
            className="font-semibold text-foreground"
          >
            {currentPage}
          </span>{" "}
          / {totalPages}
        </li>

        <li>
          <PageLink
            href={hrefFor(currentPage + 1)}
            disabled={nextDisabled}
            ariaLabel="次のページに移動"
          >
            <span className="hidden sm:inline me-1">次へ</span>
            <ChevronRight aria-hidden="true" className="h-4 w-4 rtl-flip" />
          </PageLink>
        </li>
      </ul>
    </nav>
  );
}

/**
 * Page 1 ボタン (1 つ分のセル)。
 *
 * - 通常: `ui/Button` (variant=outline, size=sm) を `asChild` で `<Link>` に被せる
 * - 現在ページ: brand-orange の塗りに切り替え (`aria-current=page`)
 * - disabled: `<span role="link" aria-disabled>` でリンクの代替表現
 */
function PageLink({
  href,
  disabled,
  isCurrent,
  ariaLabel,
  children,
}: {
  href: string;
  disabled?: boolean;
  isCurrent?: boolean;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  // タッチ領域 44x44px (WCAG 2.5.5 AAA / 2.5.8 AA) を満たすため、モバイル(<sm)
  // で min-h-11/min-w-11 を強制する。デスクトップでは従来通り min-h-9/min-w-9。
  const baseCls =
    "inline-flex min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors";

  if (disabled) {
    // axe-core の aria-prohibited-attr 対策で `role="link"` を付与する。
    // (`<span>` に直接 `aria-label` を付けると prohibited 違反になる)
    return (
      <span
        role="link"
        aria-disabled="true"
        aria-label={ariaLabel}
        className={cn(
          baseCls,
          "border-border bg-surface text-muted opacity-50 cursor-not-allowed",
        )}
      >
        {children}
      </span>
    );
  }

  if (isCurrent) {
    // 同上: `<span>` に `aria-label` を付けるため `role="link"` を明示する。
    return (
      <span
        role="link"
        aria-current="page"
        aria-label={ariaLabel}
        className={cn(
          baseCls,
          "border-brand-orange bg-brand-orange text-white cursor-default pointer-events-none",
        )}
      >
        {children}
      </span>
    );
  }

  // ui/Button (outline) を asChild で `<Link>` に被せる。
  // size=sm (h-8) ではなく custom h-9/w-9 を維持するため、px-3 と min-* を上書き。
  return (
    <Button
      asChild
      variant="outline"
      size="sm"
      className={cn(
        baseCls,
        "border-border bg-surface text-foreground hover:border-brand-orange hover:text-brand-orange hover:bg-surface",
      )}
    >
      <Link href={href} aria-label={ariaLabel}>
        {children}
      </Link>
    </Button>
  );
}

function appendPageParam(baseUrl: string, page: number): string {
  // 既存の `page` パラメータを置換しつつ、相対 URL も扱う。
  const [pathname, search = ""] = baseUrl.split("?");
  const params = new URLSearchParams(search);
  params.set("page", String(page));
  const q = params.toString();
  return q ? `${pathname}?${q}` : pathname;
}
