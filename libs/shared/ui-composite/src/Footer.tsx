import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { cn } from "@tech-event/shared-util-cn";
import { Separator } from "@tech-event/shared-ui";
import { loadDict, t } from "@/lib/i18n";

export type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type FooterGroup = {
  title: string;
  links: FooterLink[];
};

export type FooterProps = {
  /** リンクグループ。未指定の場合はデフォルトのサイトリンク群を使う。 */
  groups?: FooterGroup[];
  /** コピーライト文字列 */
  copyright?: string;
  className?: string;
};

function buildDefaultGroups(dict: Dict): FooterGroup[] {
  return [
    {
      title: t(dict, "footer.help"),
      links: [
        { label: t(dict, "footer.guide"), href: "/guide" },
        { label: t(dict, "footer.faq"), href: "/faq" },
        { label: t(dict, "footer.contact"), href: "/contact" },
      ],
    },
    {
      title: t(dict, "footer.siteInfo"),
      links: [
        { label: t(dict, "footer.company"), href: "/about" },
        { label: t(dict, "footer.api"), href: "/about/api" },
        { label: t(dict, "footer.pricing"), href: "/pricing" },
        { label: t(dict, "footer.ads"), href: "/ad" },
      ],
    },
    {
      title: t(dict, "footer.legal"),
      links: [
        { label: t(dict, "footer.terms"), href: "/terms" },
        { label: t(dict, "footer.privacy"), href: "/privacy" },
        { label: t(dict, "footer.tokushoho"), href: "/legal/tokushoho" },
      ],
    },
  ];
}

// Footer.tsx は Async Server Component。dict は loadDict() で解決する。
type Dict = Awaited<ReturnType<typeof loadDict>>["dict"];

export type FooterViewProps = {
  groups: FooterGroup[];
  copyright: string;
  tagline: string;
  className?: string;
};

/**
 * 同期版プレゼンテーション。Storybook / テストでは async loader を経由せず
 * これを直接レンダリングできるようにする (Storybook は async コンポーネントを
 * 直接レンダリング不可)。
 */
export function FooterView({
  groups: finalGroups,
  copyright: finalCopyright,
  tagline,
  className,
}: FooterViewProps) {
  return (
    <footer
      role="contentinfo"
      className={cn(
        "mt-12 border-t border-border bg-surface text-sm text-muted-foreground",
        className,
      )}
    >
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* ロゴ + 一言 */}
          <div className="md:col-span-1">
            <Link
              href="/"
              className="inline-block text-xl font-bold text-brand-orange hover:text-brand-orange-hover"
            >
              tech-event
            </Link>
            <p className="mt-2 text-xs leading-relaxed">{tagline}</p>
          </div>

          {/* リンク群 */}
          {finalGroups.map((group) => (
            <FooterGroupBlock key={group.title} group={group} />
          ))}
        </div>

        {/* 区切り線 (装飾用) + 下段 SNS + コピーライト */}
        <Separator className="mt-10 mb-6" />
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <ul className="flex items-center gap-3" aria-label="SNS リンク">
            <li>
              <a
                href="https://x.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X (Twitter) 公式アカウント (新しいタブで開く)"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground hover:bg-brand-orange-soft hover:text-brand-orange transition-colors"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="currentColor"
                >
                  <path d="M18.244 2H21l-6.522 7.45L22 22h-6.828l-4.77-6.225L4.8 22H2.043l6.98-7.97L2 2h6.969l4.33 5.715L18.244 2zm-2.39 18h1.673L7.245 4H5.45l10.405 16z" />
                </svg>
              </a>
            </li>
            <li>
              <a
                href="https://facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook 公式アカウント (新しいタブで開く)"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground hover:bg-brand-orange-soft hover:text-brand-orange transition-colors"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="currentColor"
                >
                  <path d="M22 12.06C22 6.51 17.52 2 12 2S2 6.51 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.78-3.91 1.1 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.44 2.91h-2.34V22c4.78-.79 8.43-4.94 8.43-9.94z" />
                </svg>
              </a>
            </li>
            <li>
              <a
                href="https://github.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub 公式アカウント (新しいタブで開く)"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground hover:bg-brand-orange-soft hover:text-brand-orange transition-colors"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="currentColor"
                >
                  <path d="M12 .5C5.65.5.5 5.66.5 12.02c0 5.09 3.29 9.4 7.86 10.93.58.1.79-.25.79-.56v-2.02c-3.2.69-3.87-1.36-3.87-1.36-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.69.08-.69 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.24.72-1.53-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.47.11-3.06 0 0 .96-.31 3.15 1.18a10.93 10.93 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.63 1.59.23 2.77.12 3.06.73.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.78 1.06.78 2.13v3.16c0 .31.21.67.8.56C20.22 21.42 23.5 17.1 23.5 12.02 23.5 5.66 18.35.5 12 .5z" />
                </svg>
              </a>
            </li>
          </ul>
          <p className="text-xs text-muted">{finalCopyright}</p>
        </div>
      </div>
    </footer>
  );
}

/**
 * グローバルフッター (Async Server Component)。
 *
 * - 4 カラム以下のリンク群 + 下段に SNS / コピーライト
 * - モバイル (<768px) では 1 カラムへ
 * - 各リンク群は `<nav aria-label="グループ名">` でラップ
 *
 * 下段とリンク群の境界は `ui/Separator` (= Radix Separator) を利用し、
 * `role="separator"` を明示する。装飾用なので `decorative` 既定 (true)。
 *
 * Storybook など async コンポーネントを直接レンダリングできない環境では、
 * 同期版 `FooterView` を利用する。
 */
export default async function Footer({
  groups,
  copyright,
  className,
}: FooterProps) {
  const { dict } = await loadDict();
  const finalGroups = groups ?? buildDefaultGroups(dict);
  const finalCopyright =
    copyright ?? t(dict, "footer.copyright", { year: new Date().getFullYear() });
  const tagline = t(dict, "footer.tagline");
  return (
    <FooterView
      groups={finalGroups}
      copyright={finalCopyright}
      tagline={tagline}
      className={className}
    />
  );
}

function FooterGroupBlock({ group }: { group: FooterGroup }) {
  if (group.links.length === 0) return null;
  return (
    <nav aria-label={group.title}>
      <h2 className="text-sm font-bold text-foreground">{group.title}</h2>
      <ul className="mt-3 space-y-2">
        {group.links.map((link) => (
          <li key={link.href}>
            {link.external ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm hover:text-brand-orange hover:underline"
              >
                {link.label}
                <ExternalLink aria-hidden="true" className="h-3 w-3" />
                <span className="sr-only">(新しいタブで開く)</span>
              </a>
            ) : (
              <Link
                href={link.href}
                className="text-sm hover:text-brand-orange hover:underline"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
