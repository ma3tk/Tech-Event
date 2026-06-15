"use client";

/**
 * EventStickyCTA
 *
 * Luma の sticky bottom CTA を参考にした、イベント詳細ページ下部のフローティング
 * 申込バー。メインの申込ボックス (id=`apply-heading` 等) が画面外に出たら下から
 * 滑り出す。
 *
 * - モバイル: 画面下部に常時 56px 高のバー。タイトル + 状態表示 + CTA
 * - デスクトップ: 申込ボックスが画面外のときのみ表示
 * - Intersection Observer で `observeId` を観察 → 可視率 < `threshold` で表示
 * - 自身は state を持たない (= 申込ボックスの DOM 構造を複製しない)。
 *   ラベル決定は親 (Server Component) から `state` プロパティで貰う
 *
 * `data-testid="sticky-cta"` で E2E から参照する。
 *
 * 内部の申込ボタンは `ui/Button` の asChild パターンで Link/anchor 化。
 * data-state / data-testid は E2E 互換のため Link/anchor 側に保持。
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@tech-event/shared-util-cn";
import { Button } from "@tech-event/shared-ui";
import { tokyoHm, tokyoYmdSlash } from "./tokyo-date";

/**
 * register-button.md の state machine を sticky CTA 用にまとめたもの。
 *
 * - cancelled: イベントが中止
 * - ended:    イベント終了済み
 * - upcoming: 受付開始前 (acceptsFrom > now)
 * - closed:   受付終了
 * - going:    自分が参加確定 (accepted)
 * - waiting:  自分が補欠登録中 (waiting)
 * - pending:  自分が抽選申込中 (pending)
 * - full:     枠が満員で補欠登録可能
 * - lottery:  抽選方式で申込可能
 * - open:     先着順で申込可能
 */
export type StickyState =
  | "cancelled"
  | "ended"
  | "upcoming"
  | "closed"
  | "going"
  | "waiting"
  | "pending"
  | "full"
  | "lottery"
  | "open";

export type EventStickyCTAProps = {
  /** Intersection Observer で観察する要素の DOM ID */
  observeId: string;
  /** イベントタイトル (バーの左に表示) */
  eventTitle: string;
  /** ボタンに使う状態 (Server で決定) */
  state: StickyState;
  /** ログイン済みか (false なら /login にリダイレクト) */
  loggedIn: boolean;
  /** eventId (申込ボタンの jump-to anchor + login next 用) */
  eventId: string;
  /** 受付開始日時 (state="upcoming" のとき "受付開始: ..." と表示) */
  acceptsFromIso?: string;
  /**
   * locale 化したラベル (Server Component で `loadDict()` 後に渡す)。
   * 未指定時は日本語デフォルトを使う。
   */
  labels?: Partial<Record<StickyState, string>>;
  /** "ログインして参加" 相当のラベル */
  loginLabel?: string;
  /** "受付開始: {time}" のテンプレート (例: "Opens: {time}") */
  acceptsFromTemplate?: string;
  /** `<div role="region" aria-label=...>` の aria-label */
  ariaLabel?: string;
};

const DEFAULT_LABELS: Record<StickyState, string> = {
  cancelled: "中止されました",
  ended: "終了しました",
  upcoming: "受付開始前",
  closed: "募集締切",
  going: "参加済み",
  waiting: "補欠登録中",
  pending: "抽選申込中",
  full: "補欠登録",
  lottery: "抽選に申し込む",
  open: "参加申込",
};

const DISABLED_STATES: ReadonlySet<StickyState> = new Set([
  "cancelled",
  "ended",
  "upcoming",
  "closed",
  "going",
  "waiting",
  "pending",
]);

/**
 * "YYYY/MM/DD HH:mm" (表示タイムゾーン = JST 固定)。
 *
 * ローカル時刻依存の getHours() 等を使うと SSR/client の TZ 差で hydration
 * mismatch を起こすため、固定タイムゾーンで分解して整形する。
 */
function formatJa(d: Date): string {
  return `${tokyoYmdSlash(d)} ${tokyoHm(d)}`;
}

export default function EventStickyCTA({
  observeId,
  eventTitle,
  state,
  loggedIn,
  eventId,
  acceptsFromIso,
  labels,
  loginLabel,
  acceptsFromTemplate,
  ariaLabel,
}: EventStickyCTAProps) {
  // visible は「メイン申込ボックスが画面外か?」。モバイルでは常時表示する
  const [visible, setVisible] = useState(false);
  // ハイドレーション後に true にして、SSR ではバーを描画しない (ちらつき防止)
  const [mounted, setMounted] = useState(false);
  const elRef = useRef<HTMLDivElement | null>(null);

  // hydration mismatch 防止: mount 後に SSR-only state を反映する意図的パターン。
  // IntersectionObserver は副作用なので useEffect が適切。
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR/CSR 境界で必要
    setMounted(true);
    const target = document.getElementById(observeId);
    if (!target) {
      // メイン申込ボックスが見つからない場合はとりあえず表示する
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        // メイン申込ボックスが「画面に 1px も見えていない」とき sticky CTA を出す
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0.01 },
    );
    io.observe(target);
    return () => io.disconnect();
  }, [observeId]);

  // モバイル幅 (md 未満) は常時表示する設計だが、CSS で出し分ける方が単純なので
  // `hidden md:flex` ベースのクラスを使わず、JS 制御で出し入れする。
  // ただしユーザーへの「初回ロード時にすぐ見える」体験を維持するため、初期は
  // モバイル時のみ表示する。
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => {
      if (mq.matches) setVisible(true);
    };
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  if (!mounted) return null;

  const label = labels?.[state] ?? DEFAULT_LABELS[state];
  const disabled = DISABLED_STATES.has(state);
  const acceptsFrom = acceptsFromIso ? new Date(acceptsFromIso) : null;
  const finalLoginLabel = loginLabel ?? "ログインして参加";
  const finalAriaLabel = ariaLabel ?? "参加申込クイックアクセス";
  const acceptsFromText = (() => {
    if (!acceptsFrom) return "";
    const time = formatJa(acceptsFrom);
    if (acceptsFromTemplate)
      return acceptsFromTemplate.replace("{time}", time);
    return `受付開始: ${time}`;
  })();

  return (
    <div
      ref={elRef}
      role="region"
      aria-label={finalAriaLabel}
      data-testid="sticky-cta"
      data-visible={visible ? "true" : "false"}
      data-state={state}
      className={cn(
        // 下部固定 / モバイル 56px / セーフエリア考慮
        // Luma 風: shadow-soft-lg (Tailwind v4 @theme inline 経由)
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface",
        "shadow-soft-lg",
        "pb-[env(safe-area-inset-bottom)] transition-transform duration-200",
        visible ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <div className="flex-1 min-w-0">
          <p
            data-testid="sticky-cta-title"
            className="truncate text-sm font-semibold text-foreground"
          >
            {eventTitle}
          </p>
          {state === "upcoming" && acceptsFrom && (
            <p className="truncate text-[11px] text-muted-foreground">
              {acceptsFromText}
            </p>
          )}
        </div>
        {!loggedIn && !disabled ? (
          <Button
            asChild
            // 旧見た目: h-10 / px-5 / brand-orange + white / font-semibold
            // Luma 風: rounded-2xl + shadow-soft-md
            size="md"
            className="h-10 rounded-2xl px-5 text-sm font-semibold shadow-soft-md"
          >
            <Link
              href={`/login?next=${encodeURIComponent(`/event/${eventId}`)}`}
              data-testid="sticky-cta-button"
              data-state={state}
            >
              {finalLoginLabel}
            </Link>
          </Button>
        ) : (
          <Button
            asChild
            size="md"
            variant={
              disabled
                ? "secondary"
                : state === "full"
                  ? "outline"
                  : "default"
            }
            className={cn(
              "h-10 rounded-2xl px-5 text-sm font-semibold shadow-soft-md",
              disabled &&
                "cursor-not-allowed bg-border-strong text-muted-foreground pointer-events-none border-0",
              !disabled &&
                state === "full" &&
                "border-brand-orange text-brand-orange hover:bg-brand-orange-soft",
            )}
          >
            {/*
             * disabled 状態は `<a>` を残しつつ `tabIndex={-1}` / `onClick` を no-op
             * にしてキーボード Tab 到達と Enter での scroll を完全に止める。
             * Sticky CTA テストでは href 属性の存在を検証するため、
             * `href` 自体は `#apply-heading` のままにしておく。
             * (空文字にすると WCAG ARIA 規則と Playwright の href 検証に抵触)
             */}
            <a
              href={`#apply-heading`}
              data-testid="sticky-cta-button"
              data-state={state}
              aria-disabled={disabled ? "true" : undefined}
              tabIndex={disabled ? -1 : undefined}
              onClick={disabled ? (e) => e.preventDefault() : undefined}
              onKeyDown={
                disabled
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                      }
                    }
                  : undefined
              }
            >
              {label}
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
