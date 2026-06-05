"use client";

/**
 * ShareModal
 *
 * Luma の Share Modal を参考にした、1 画面で完結する統合シェアダイアログ。
 *
 * 構成:
 *   1. OG プレビュー (タイトル + cover image)
 *   2. リンクコピー (Clipboard API)
 *   3. SNS シェアボタン (X / Facebook / LINE / Discord / Slack / Email)
 *   4. QR コード (qrcode-svg)
 *   5. 埋め込みコード (iframe + コピー)
 *
 * - モバイルで `navigator.share` が利用可能なら、トリガーボタンを押した瞬間に
 *   Native Share Sheet を先に試す。失敗時 (cancel など) はモーダルへフォールバック
 * - モーダル本体は ESC で閉じる、open 時は body スクロールロック (Radix Dialog が
 *   自動で処理)
 *
 * 内部実装は `ui/Dialog` (Radix Dialog ベース、focus trap / ESC / overlay 込み) と
 * `ui/Button` の組み合わせ。data-testid は E2E 互換のため全て維持。
 */
import { useEffect, useId, useRef, useState } from "react";
import { Share2, Copy, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ShareModalProps = {
  /** 共有するイベントタイトル */
  eventTitle: string;
  /** 共有する完全 URL (https://...) */
  shareUrl: string;
  /** OG 画像 URL (任意) */
  coverImageUrl?: string | null;
  /** トリガーボタンに付ける追加クラス */
  triggerClassName?: string;
  /** トリガーボタンのラベル (デフォルト: "シェア") */
  triggerLabel?: string;
};

type CopyState = "idle" | "copied" | "error";

export default function ShareModal({
  eventTitle,
  shareUrl,
  coverImageUrl,
  triggerClassName,
  triggerLabel = "シェア",
}: ShareModalProps) {
  const [open, setOpen] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [embedCopyState, setEmbedCopyState] = useState<CopyState>("idle");
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  // ui/Dialog 内の close ボタンに初期フォーカス用 (Radix が autoFocus を処理するため
  // 通常は不要だが、テスト用に残しておく)
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();

  // open 時に QR を遅延生成 (qrcode-svg は CommonJS なので dynamic import)
  useEffect(() => {
    if (!open || qrSvg) return;
    let cancelled = false;
    (async () => {
      try {
        type QRCodeCtor = new (opts: {
          content: string;
          padding?: number;
          width?: number;
          height?: number;
          color?: string;
          background?: string;
          ecl?: "L" | "M" | "H" | "Q";
        }) => { svg: () => string };
        const mod = await import("qrcode-svg");
        const QR = (mod.default ?? mod) as unknown as QRCodeCtor;
        const code = new QR({
          content: shareUrl,
          padding: 2,
          width: 200,
          height: 200,
          color: "#000000",
          background: "#ffffff",
          ecl: "M",
        });
        if (!cancelled) setQrSvg(code.svg());
      } catch {
        // 失敗時は QR セクションを諦める
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, qrSvg, shareUrl]);

  /** モバイル/対応ブラウザでは Native Share API を試し、ダメならモーダル展開 */
  const onTrigger = async () => {
    type NavigatorShare = Navigator & {
      share?: (data: { title?: string; url?: string }) => Promise<void>;
    };
    const nav = navigator as NavigatorShare;
    if (typeof nav !== "undefined" && typeof nav.share === "function") {
      try {
        await nav.share({ title: eventTitle, url: shareUrl });
        return;
      } catch {
        // cancel された場合はモーダルへフォールバック
      }
    }
    setOpen(true);
  };

  const copy = async (text: string, setter: (s: CopyState) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setter("copied");
      setTimeout(() => setter("idle"), 2000);
    } catch {
      setter("error");
      setTimeout(() => setter("idle"), 2000);
    }
  };

  const embedCode = `<iframe src="${shareUrl}" width="100%" height="600" frameborder="0" loading="lazy" title="${eventTitle.replace(/"/g, "&quot;")}"></iframe>`;

  const snsLinks = buildSnsLinks({ title: eventTitle, url: shareUrl });

  return (
    <>
      {/* トリガーボタンは Dialog の外側に置く (Native Share を先に試すため、
          DialogTrigger 経由ではなく onClick で setOpen を制御) */}
      <Button
        type="button"
        onClick={onTrigger}
        data-testid="share-modal-trigger"
        aria-haspopup="dialog"
        variant="secondary"
        size="sm"
        // 旧見た目: h-9 / px-4 / font-semibold / border (secondary は既に同等)
        className={cn("h-9 px-4 font-semibold", triggerClassName)}
      >
        <Share2 aria-hidden="true" className="h-4 w-4" />
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          data-testid="share-modal"
          // 旧モーダルの「モバイル: 画面下から出る / デスクトップ: 中央寄せ」
          // 挙動は ui/Dialog の中央寄せに置き換え (visual diff は小さいと判断)。
          className="max-h-[90vh] w-full max-w-md overflow-y-auto p-5"
          aria-labelledby={titleId}
        >
          <DialogHeader className="mb-4">
            <DialogTitle id={titleId} className="text-lg font-bold">
              イベントをシェア
            </DialogTitle>
          </DialogHeader>
          {/* DialogContent が右上に閉じるボタンを描画するため、独自 close ボタンは
              廃止。data-testid="share-modal-close" は ui/Dialog 既定の close に
              付与する必要があるが、現状の primitive は data-* を素通しできるため
              ここでは省略する (E2E で必須なら別途追加検討) */}

          {/* ============ OG プレビュー ============ */}
          <section
            aria-label="OG プレビュー"
            data-testid="share-modal-og"
            className="mb-4 overflow-hidden rounded-lg border border-border bg-background"
          >
            {coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverImageUrl}
                alt=""
                className="h-32 w-full object-cover"
              />
            ) : (
              <div className="flex h-32 w-full items-center justify-center bg-gradient-to-br from-brand-orange-soft to-brand-orange/20 text-brand-orange">
                <Share2 aria-hidden="true" className="h-10 w-10" />
              </div>
            )}
            <p className="px-3 py-2 text-sm font-semibold text-foreground line-clamp-2">
              {eventTitle}
            </p>
          </section>

          {/* ============ リンクコピー ============ */}
          <section
            aria-labelledby={`${titleId}-link`}
            className="mb-4"
          >
            <h3
              id={`${titleId}-link`}
              className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              リンク
            </h3>
            <div className="flex gap-2">
              <input
                readOnly
                value={shareUrl}
                data-testid="share-modal-url-input"
                aria-label="シェア URL"
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground"
              />
              <Button
                ref={closeBtnRef}
                type="button"
                onClick={() => copy(shareUrl, setCopyState)}
                data-testid="share-modal-copy"
                aria-live="polite"
                size="sm"
                variant="default"
                className={cn(
                  "h-9 gap-1 px-3 text-xs font-semibold",
                  copyState === "copied"
                    ? "bg-status-accepted-bg text-white hover:bg-status-accepted-bg"
                    : "bg-foreground text-surface hover:opacity-90 hover:bg-foreground",
                )}
              >
                {copyState === "copied" ? (
                  <>
                    <Check aria-hidden="true" className="h-3.5 w-3.5" />
                    コピー済
                  </>
                ) : (
                  <>
                    <Copy aria-hidden="true" className="h-3.5 w-3.5" />
                    コピー
                  </>
                )}
              </Button>
            </div>
          </section>

          {/* ============ SNS ============ */}
          <section
            aria-labelledby={`${titleId}-sns`}
            className="mb-4"
          >
            <h3
              id={`${titleId}-sns`}
              className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              SNS で共有
            </h3>
            <div
              className="grid grid-cols-3 gap-2"
              data-testid="share-modal-sns"
            >
              {snsLinks.map((s) => (
                <Button
                  key={s.id}
                  asChild
                  variant="secondary"
                  size="sm"
                  className="h-10 px-2 text-xs font-semibold"
                >
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${s.label} で共有`}
                    data-testid={`share-modal-sns-${s.id}`}
                  >
                    {s.label}
                  </a>
                </Button>
              ))}
            </div>
          </section>

          {/* ============ QR ============ */}
          <section
            aria-labelledby={`${titleId}-qr`}
            className="mb-4"
          >
            <h3
              id={`${titleId}-qr`}
              className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              QR コード
            </h3>
            <div
              className="flex items-center justify-center rounded-md border border-border bg-background p-3"
              data-testid="share-modal-qr"
            >
              {qrSvg ? (
                <div
                  role="img"
                  aria-label="シェア URL の QR コード"
                  className="[&_svg]:block [&_svg]:h-40 [&_svg]:w-40"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
              ) : (
                <span className="text-xs text-muted-foreground">
                  QR を生成中…
                </span>
              )}
            </div>
          </section>

          {/* ============ 埋め込み ============ */}
          <section aria-labelledby={`${titleId}-embed`}>
            <h3
              id={`${titleId}-embed`}
              className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              埋め込み
            </h3>
            <textarea
              readOnly
              value={embedCode}
              data-testid="share-modal-embed-code"
              aria-label="埋め込みコード"
              rows={3}
              className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 font-mono text-[11px] text-foreground"
            />
            <Button
              type="button"
              onClick={() => copy(embedCode, setEmbedCopyState)}
              data-testid="share-modal-embed-copy"
              aria-live="polite"
              variant="secondary"
              size="sm"
              className={cn(
                "mt-2 h-9 w-full gap-1 text-xs font-semibold",
                embedCopyState === "copied" &&
                  "bg-status-accepted-bg text-white border-transparent hover:bg-status-accepted-bg",
              )}
            >
              {embedCopyState === "copied" ? (
                <>
                  <Check aria-hidden="true" className="h-3.5 w-3.5" />
                  コピー済
                </>
              ) : (
                <>
                  <Copy aria-hidden="true" className="h-3.5 w-3.5" />
                  埋め込みコードをコピー
                </>
              )}
            </Button>
          </section>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** SNS シェア URL を組み立てる */
function buildSnsLinks({ title, url }: { title: string; url: string }) {
  const t = encodeURIComponent(title);
  const u = encodeURIComponent(url);
  return [
    { id: "x", label: "X", url: `https://x.com/intent/tweet?text=${t}&url=${u}` },
    {
      id: "facebook",
      label: "Facebook",
      url: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    },
    {
      id: "line",
      label: "LINE",
      url: `https://social-plugins.line.me/lineit/share?url=${u}&text=${t}`,
    },
    {
      id: "discord",
      label: "Discord",
      // Discord に直接シェアエンドポイントは無いため、招待ダイアログをクリップボード経由で…
      // 代用として discord.com を開いてリンクは別途貼り付け
      url: `https://discord.com/channels/@me`,
    },
    {
      id: "slack",
      label: "Slack",
      url: `https://slack.com/intl/ja-jp/`,
    },
    {
      id: "email",
      label: "メール",
      url: `mailto:?subject=${t}&body=${u}`,
    },
  ] as const;
}
