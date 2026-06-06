/**
 * Embed カレンダー用のミニマルレイアウト。
 *
 * Event 用と同じく Header / Footer なし、自前 `<html>` で minimal layout を提供。
 * 親ページに高さを postMessage で通知する。
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
  title: "カレンダー埋め込み",
  robots: { index: false, follow: false },
};

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

export default function EmbedCalendarLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      data-embed="calendar"
      className={`${notoSansJP.variable} antialiased`}
    >
      <body
        data-testid="embed-root"
        className="bg-background text-foreground"
        style={{ margin: 0 }}
      >
        {children}
        <script dangerouslySetInnerHTML={{ __html: HEIGHT_NOTIFIER_SCRIPT }} />
      </body>
    </html>
  );
}
