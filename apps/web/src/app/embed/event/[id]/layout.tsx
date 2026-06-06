/**
 * Embed 用のミニマルレイアウト。
 *
 * - グローバルの `app/layout.tsx` には Header / Footer / SkipLink が含まれているが、
 *   iframe で埋め込む際は不要なので、ここで `<html>` を自前出力する。
 * - `data-embed="event"` を `<html>` に付けて識別可能にする。
 * - 親ページへ高さを `postMessage` で通知するためのスクリプトを差し込む。
 * - `data-testid="embed-root"` を `<body>` に付けて E2E から検出できるようにする。
 *
 * NOTE: `app/embed/.../layout.tsx` が `<html>` を含むので、Next.js が自動的に
 *   親レイアウトを置き換える (Route Groups の代わりの仕組み)。
 */

import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "../../../globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "イベント埋め込み",
  robots: { index: false, follow: false },
};

/**
 * iframe 内でレンダリング後の document の高さを親ウィンドウに通知する。
 * 親側は `window.addEventListener('message', ...)` で受け取って iframe の
 * `height` を可変にできる。
 */
const HEIGHT_NOTIFIER_SCRIPT = `
(function(){
  function send(){
    try {
      var h = document.documentElement.scrollHeight;
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'tech-event:embed:height', height: h }, '*');
      }
    } catch (e) {}
  }
  window.addEventListener('load', send);
  if (typeof ResizeObserver !== 'undefined') {
    var ro = new ResizeObserver(send);
    ro.observe(document.documentElement);
  } else {
    setInterval(send, 1000);
  }
})();
`;

export default function EmbedEventLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      data-embed="event"
      className={`${notoSansJP.variable} antialiased`}
    >
      <body
        data-testid="embed-root"
        className="bg-background text-foreground"
        style={{ margin: 0 }}
      >
        {children}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: HEIGHT_NOTIFIER_SCRIPT }} />
      </body>
    </html>
  );
}
