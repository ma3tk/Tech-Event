"use client";

/**
 * 言語切替 (LanguageSwitcher)
 *
 * - DropdownMenu で日本語 / English を選択
 * - 選択時に `?lang=ja|en` を付けたまま再ロード → middleware が cookie を更新
 * - 現在の locale は cookie から読み取って初期表示する (Client 側)
 */
import { useEffect, useState } from "react";
import { Globe } from "lucide-react";

import { Button } from "@tech-event/shared-ui";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@tech-event/shared-ui";

const LOCALE_COOKIE = "tech_event_locale";
const SUPPORTED = ["ja", "en"] as const;
type Locale = (typeof SUPPORTED)[number];

const LABELS: Record<Locale, string> = {
  ja: "日本語",
  en: "English",
};

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/[.$?*|{}()[\]\\/+^]/g, "\\$&") + "=([^;]*)"),
  );
  return m ? decodeURIComponent(m[1] ?? "") : null;
}

function applyLang(next: Locale): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("lang", next);
  window.location.assign(url.toString());
}

export default function LanguageSwitcher({
  initialLocale,
}: {
  initialLocale?: Locale;
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale ?? "ja");

  // mount 後に cookie からロケールを反映する hydration パターン。
  useEffect(() => {
    const fromCookie = readCookie(LOCALE_COOKIE);
    if (fromCookie === "ja" || fromCookie === "en") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR/CSR 境界で cookie 同期
      setLocale(fromCookie);
    }
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="言語を切り替え / Change language"
          data-testid="language-switcher"
          className="hover:bg-brand-orange-soft"
        >
          <Globe aria-hidden="true" className="h-5 w-5 text-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Language</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={locale}
          onValueChange={(v) => applyLang(v as Locale)}
        >
          {SUPPORTED.map((loc) => (
            <DropdownMenuRadioItem
              key={loc}
              value={loc}
              data-testid={`language-${loc}`}
            >
              {LABELS[loc]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
