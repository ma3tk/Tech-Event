import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { headers } from "next/headers";
import { Suspense } from "react";
import HeaderServer from "@/components/HeaderServer";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import ToastListener from "@/components/ToastListener";
import {
  BASE_URL,
  DEFAULT_DESCRIPTION,
  DEFAULT_LOCALE,
  SITE_NAME,
} from "@/lib/seo";
import { getLocale, loadDict, t as translate } from "@/lib/i18n";
import "./globals.css";

/**
 * FOUC 防止用のテーマ先行設定スクリプト。
 * `<html>` の `data-theme` を hydration 前に localStorage / matchMedia から
 * 同期決定することで、初回描画で light → dark の点滅 (FOUC) を防ぐ。
 *
 * 失敗時 (private mode 等) は何もしないので、ThemeProvider 側の既存ロジックが
 * mount 後に正しい値を当て直す。
 */
const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem('tech-event:theme');var c=localStorage.getItem('tech-event:contrast');var t=s==='light'||s==='dark'?s:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);document.documentElement.setAttribute('data-contrast',c==='more'?'more':'normal');}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: `${SITE_NAME} - エンジニアのための勉強会・イベント支援`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": [
        { url: "/feed.xml", title: `${SITE_NAME} の新着イベント` },
      ],
    },
  },
  openGraph: {
    type: "website",
    url: BASE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - エンジニアのための勉強会・イベント支援`,
    description: DEFAULT_DESCRIPTION,
    locale: DEFAULT_LOCALE,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - エンジニアのための勉強会・イベント支援`,
    description: DEFAULT_DESCRIPTION,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
  },
};

/**
 * 埋め込み (`/embed/...`) パス判定。
 * `next/headers` の `x-pathname` から判定する (middleware ではなく Next 16 の
 * 標準ヘッダ `x-invoke-path` / Vercel の `x-matched-path` を見るのは脆いため、
 * シンプルに pathname を渡す代わりに referer / 環境を見ない実装にする)。
 *
 * NOTE: 確実なのは pathname を `next/navigation` の `usePathname()` で取る
 *   ことだが、Server Component では使えない。ここでは `x-next-pathname` を
 *   header から拾えなければ常に Header/Footer を出す方針。
 */
async function isEmbedRoute(): Promise<boolean> {
  try {
    const h = await headers();
    // Next.js 16 / Turbopack で送られる擬似ヘッダ
    const pathname =
      h.get("x-pathname") ??
      h.get("x-invoke-path") ??
      h.get("next-url") ??
      "";
    return pathname.startsWith("/embed/");
  } catch {
    return false;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const embed = await isEmbedRoute();
  if (embed) {
    // 埋め込み用は子レイアウト (`/embed/.../layout.tsx`) で独自 <html> を出すため
    // ここではフラグメントだけ返す。実際の <html><body> は子レイアウトが担当。
    return <>{children}</>;
  }
  // middleware で決定された locale を読み取り、`<html lang>` を動的に出す。
  // WCAG 3.1.1 / OG locale との整合のため、ja → ja-JP / en → en-US の
  // BCP47 を `<html lang>` に出す。
  const locale = await getLocale();
  const { dict } = await loadDict(locale);
  const htmlLang = locale === "en" ? "en-US" : "ja-JP";
  return (
    <html
      lang={htmlLang}
      data-theme="light"
      className={`${notoSansJP.variable} h-full antialiased`}
    >
      <head>
        {/* テーマ FOUC 防止: hydration 前に data-theme を当てる。 */}
        <script
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <TooltipProvider delayDuration={150}>
            <a href="#main" className="skip-link">
              {translate(dict, "common.skipToMain") === "common.skipToMain"
                ? locale === "en"
                  ? "Skip to main content"
                  : "メインコンテンツへスキップ"
                : translate(dict, "common.skipToMain")}
            </a>
            <HeaderServer />
            <main id="main" className="flex-1 w-full">
              {children}
            </main>
            <Footer />
            <Toaster position="bottom-right" richColors />
            {/* useSearchParams を含む Client Component は Suspense 境界が必須
                (Next 16 の CSR bailout 対策: 404 等の static fallback を可能にする) */}
            <Suspense fallback={null}>
              <ToastListener />
            </Suspense>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
