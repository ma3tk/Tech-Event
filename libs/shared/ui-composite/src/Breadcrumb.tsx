import { Fragment } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@tech-event/shared-util-cn";
import { safeJsonLd } from "@tech-event/shared-util-markdown";
import { absoluteUrl } from "@/lib/seo";

export type BreadcrumbItem = {
  label: string;
  /** 末尾 (current) のみ undefined。それ以外は遷移先を指定。 */
  href?: string;
};

export type BreadcrumbProps = {
  items: BreadcrumbItem[];
  /** 区切り文字。デフォルトは `›` */
  separator?: React.ReactNode;
  /** 構造化データ (JSON-LD) を出力するか */
  enableJsonLd?: boolean;
  className?: string;
};

/**
 * パンくず (breadcrumb)。
 *
 * - `<nav aria-label="パンくずリスト">` + `<ol>` のセマンティック構造
 * - 末尾の項目は `<a aria-current="page">` (href 省略可) として表現
 * - SEO 用に `BreadcrumbList` の JSON-LD を併記 (`enableJsonLd`)
 *
 * 区切りは ChevronRight アイコン (装飾)。`ui/Separator` (orientation=vertical) は
 * パンくずの「短い縦線」とは視覚的に異なるため採用せず、矢印の装飾性を維持する。
 * (公開 API としては `separator` prop で上書き可能)
 */
export default function Breadcrumb({
  items,
  separator,
  enableJsonLd = true,
  className,
}: BreadcrumbProps) {
  if (items.length === 0) return null;
  const sep = separator ?? (
    <ChevronRight
      aria-hidden="true"
      className="h-3.5 w-3.5 text-muted rtl-flip"
    />
  );

  return (
    <>
      <nav
        aria-label="パンくずリスト"
        className={cn("py-2 text-sm text-muted-foreground", className)}
      >
        <ol className="flex flex-wrap items-center gap-1.5">
          {items.map((item, i) => {
            const isLast = i === items.length - 1;
            return (
              <Fragment key={`${item.label}-${i}`}>
                <li className="inline-flex items-center">
                  {item.href && !isLast ? (
                    <Link
                      href={item.href}
                      className="hover:text-brand-orange hover:underline"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      aria-current="page"
                      className="font-medium text-foreground"
                    >
                      {item.label}
                    </span>
                  )}
                </li>
                {!isLast && (
                  <li aria-hidden="true" className="inline-flex items-center">
                    {sep}
                  </li>
                )}
              </Fragment>
            );
          })}
        </ol>
      </nav>
      {enableJsonLd && <BreadcrumbJsonLd items={items} />}
    </>
  );
}

function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  /*
   * Google の BreadcrumbList リッチリザルトは `itemListElement.item` に
   * 絶対 URL を要求する。`absoluteUrl()` は http(s) スキームがそのまま渡された
   * 場合は素通しするため、外部 URL も安全に通る。
   */
  const json = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: absoluteUrl(item.href) } : {}),
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(json) }}
    />
  );
}
