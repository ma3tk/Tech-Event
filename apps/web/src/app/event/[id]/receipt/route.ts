/**
 * GET /event/[id]/receipt
 *
 * 支払い済み参加者本人向けの領収データ (HTML) を返す。
 *
 * - 認証必須。本人の Participant + Payment (succeeded | partially_refunded)
 *   が無ければ 404。
 * - 初回アクセス時に領収番号 `R-{eventId}-{seq(4桁)}` を採番して
 *   `Payment.receiptNumber` / `receiptIssuedAt` に記録する (再発行では
 *   同じ番号を維持 = 冪等)。seq はイベント内の発行済み領収データ数 + 1。
 *   採番レースは UNIQUE ではないが `withRetry` + tx 内カウントで実用上十分に防ぐ。
 * - 宛名はクエリ `?name=...` で指定可 (未指定なら既存の宛名 or 本人表示名)。
 *   指定された場合は `Payment.receiptName` を更新して次回以降も使う。
 * - 発行者名 = `Group.receiptIssuerName ?? Group.name`、
 *   適格請求書発行事業者登録番号 = `Group.invoiceRegistrationNumber` (あれば表示)。
 * - 金額は税込 (内税 10%) として消費税額の内訳を併記する。
 *
 * 対象ペルソナ: P4 (経費精算が必要な会社員参加者)。
 */

import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { withRetry } from "@/lib/id-gen";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseId(raw: string): bigint | null {
  if (!/^\d+$/.test(raw)) return null;
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

/** HTML エスケープ (宛名などユーザー入力を埋め込むため必須)。 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function yen(n: number): string {
  return `¥${n.toLocaleString("ja-JP")}`;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: raw } = await context.params;
  const id = parseId(raw);
  if (!id) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const user = await getCurrentUser();
  if (!user) {
    const loginUrl = new URL(
      `/login?next=${encodeURIComponent(`/event/${raw}/receipt`)}`,
      request.url,
    );
    return NextResponse.redirect(loginUrl);
  }

  // 本人の支払い済み Participant を探す (cancelled は除外しない:
  // キャンセル後も支払い実績があれば領収データは参照できる)
  const participant = await prisma.participant.findFirst({
    where: {
      eventId: id,
      userId: user.id,
      payment: {
        is: { status: { in: ["succeeded", "partially_refunded"] } },
      },
    },
    orderBy: { id: "desc" },
    include: {
      payment: true,
      event: {
        select: {
          id: true,
          title: true,
          startedAt: true,
          group: {
            select: {
              name: true,
              receiptIssuerName: true,
              invoiceRegistrationNumber: true,
            },
          },
        },
      },
    },
  });

  if (!participant || !participant.payment) {
    return new NextResponse(
      "領収データを発行できる支払いが見つかりません。",
      { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  const payment = participant.payment;
  const event = participant.event;

  // ---- 宛名 (クエリ指定 > 既存 > 本人表示名) ----
  const nameParam = request.nextUrl.searchParams.get("name")?.trim() ?? "";
  const receiptName =
    (nameParam ? nameParam.slice(0, 100) : "") ||
    payment.receiptName ||
    user.displayName;

  // ---- 領収番号の採番 (初回のみ) + 宛名記録 ----
  let receiptNumber = payment.receiptNumber;
  let receiptIssuedAt = payment.receiptIssuedAt;
  const needsNumber = !receiptNumber;
  const needsNameUpdate = receiptName !== payment.receiptName;

  if (needsNumber || needsNameUpdate) {
    const updated = await withRetry(() =>
      prisma.$transaction(async (tx) => {
        const current = await tx.payment.findUnique({
          where: { id: payment.id },
          select: {
            receiptNumber: true,
            receiptIssuedAt: true,
          },
        });
        let number = current?.receiptNumber ?? null;
        let issuedAt = current?.receiptIssuedAt ?? null;
        if (!number) {
          // イベント内で発行済みの領収データ数 + 1 を通し番号にする
          const issuedCount = await tx.payment.count({
            where: {
              receiptNumber: { not: null },
              participant: { eventId: id },
            },
          });
          number = `R-${id.toString()}-${String(issuedCount + 1).padStart(4, "0")}`;
          issuedAt = new Date();
        }
        return tx.payment.update({
          where: { id: payment.id },
          data: {
            receiptNumber: number,
            receiptIssuedAt: issuedAt,
            receiptName,
          },
          select: { receiptNumber: true, receiptIssuedAt: true },
        });
      }),
    );
    receiptNumber = updated.receiptNumber;
    receiptIssuedAt = updated.receiptIssuedAt;
  }

  // ---- 表示データ ----
  const issuerName = event.group.receiptIssuerName ?? event.group.name;
  const invoiceNumber = event.group.invoiceRegistrationNumber;
  const amount = payment.amount;
  // 内税 10%: 税抜 = floor(amount / 1.1)、消費税 = amount - 税抜
  const taxExcluded = Math.floor(amount / 1.1);
  const taxAmount = amount - taxExcluded;
  const refundedAmount = payment.refundedAmount ?? 0;
  const issuedAtText = (receiptIssuedAt ?? new Date()).toLocaleDateString(
    "ja-JP",
    { year: "numeric", month: "long", day: "numeric" },
  );

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>領収書 ${escapeHtml(receiptNumber ?? "")}</title>
<style>
  body { font-family: "Hiragino Sans", "Noto Sans JP", sans-serif; margin: 0; padding: 2rem 1rem; background: #f5f5f5; color: #1a1a1a; }
  .receipt { max-width: 640px; margin: 0 auto; background: #fff; border: 1px solid #ccc; padding: 2.5rem 2rem; }
  h1 { text-align: center; font-size: 1.5rem; letter-spacing: 1em; text-indent: 1em; margin: 0 0 1.5rem; }
  .meta { display: flex; justify-content: space-between; font-size: 0.8rem; color: #555; margin-bottom: 1.5rem; }
  .name { font-size: 1.1rem; border-bottom: 2px solid #1a1a1a; padding: 0 0.25rem 0.25rem; margin-bottom: 1.5rem; }
  .amount { text-align: center; font-size: 1.75rem; font-weight: 700; border: 2px solid #1a1a1a; padding: 0.75rem; margin-bottom: 0.5rem; }
  .tax-note { text-align: center; font-size: 0.75rem; color: #555; margin-bottom: 1.5rem; }
  .desc { font-size: 0.9rem; margin-bottom: 1.5rem; }
  table.breakdown { width: 100%; border-collapse: collapse; font-size: 0.8rem; margin-bottom: 1.5rem; }
  table.breakdown th, table.breakdown td { border: 1px solid #ccc; padding: 0.4rem 0.6rem; text-align: right; }
  table.breakdown th { background: #f0f0f0; text-align: left; font-weight: 600; }
  .issuer { text-align: right; font-size: 0.9rem; line-height: 1.7; }
  .issuer .issuer-name { font-weight: 700; font-size: 1rem; }
  .refund-note { font-size: 0.8rem; color: #a33; margin-bottom: 1rem; }
  .print-hint { max-width: 640px; margin: 1rem auto 0; text-align: center; font-size: 0.75rem; color: #777; }
  @media print { body { background: #fff; padding: 0; } .receipt { border: none; } .print-hint { display: none; } }
</style>
</head>
<body>
<main class="receipt" data-testid="receipt">
  <h1>領収書</h1>
  <div class="meta">
    <span data-testid="receipt-number">No. ${escapeHtml(receiptNumber ?? "")}</span>
    <span data-testid="receipt-issued-at">発行日: ${escapeHtml(issuedAtText)}</span>
  </div>
  <p class="name"><span data-testid="receipt-name">${escapeHtml(receiptName)}</span> 様</p>
  <p class="amount" data-testid="receipt-amount">${escapeHtml(yen(amount))} <small>(税込)</small></p>
  <p class="tax-note">上記金額を正に領収いたしました。</p>
  ${
    refundedAmount > 0
      ? `<p class="refund-note" data-testid="receipt-refund-note">※ うち ${escapeHtml(yen(refundedAmount))} は返金済みです。</p>`
      : ""
  }
  <p class="desc">但し ${escapeHtml(event.title)} 参加費として</p>
  <table class="breakdown">
    <tr><th>10% 対象 (税込)</th><td>${escapeHtml(yen(amount))}</td></tr>
    <tr><th>内消費税額 (10%)</th><td>${escapeHtml(yen(taxAmount))}</td></tr>
  </table>
  <div class="issuer">
    <p class="issuer-name" data-testid="receipt-issuer">${escapeHtml(issuerName)}</p>
    ${
      invoiceNumber
        ? `<p data-testid="receipt-invoice-number">登録番号: ${escapeHtml(invoiceNumber)}</p>`
        : ""
    }
  </div>
</main>
<p class="print-hint">このページを印刷 / PDF 保存してご利用ください。宛名を変えるには URL 末尾に ?name=株式会社◯◯ を付けてください。</p>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
