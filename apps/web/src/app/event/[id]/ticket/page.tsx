/**
 * 参加者本人のチケット QR ページ
 *
 * - ログイン中の参加確定者 (accepted / attended) に署名付き QR トークンを表示する。
 *   受付スタッフが `/event/[id]/admin/check-in` のカメラスキャナで読み取ってチェックインする。
 * - 未ログイン: `/login?next=...` へリダイレクト。
 * - 未参加: イベントページへの誘導を表示。
 * - `Event.allowQrCheckIn=false`: QR チェックイン無効の案内を表示。
 *
 * QR 生成は既存の `qrcode-svg` (ShareModal と同じライブラリ) をサーバ側で使用。
 * トークン発行・署名は `getMyQrTicket` (checkin-actions.ts) に集約。
 */

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getMyQrTicket } from "@/app/actions/checkin-actions";

export const dynamic = "force-dynamic";

function parseId(raw: string): bigint | null {
  if (!/^\d+$/.test(raw)) return null;
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

/** qrcode-svg (CommonJS) でトークンを SVG 化する。失敗時は null。 */
async function renderQrSvg(content: string): Promise<string | null> {
  try {
    const mod = await import("qrcode-svg");
    const QR = mod.default;
    return new QR({
      content,
      padding: 2,
      width: 240,
      height: 240,
      color: "#000000",
      background: "#ffffff",
      ecl: "M",
    }).svg();
  } catch {
    return null;
  }
}

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: raw } = await params;
  const id = parseId(raw);
  if (!id) notFound();

  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      startedAt: true,
      place: true,
      allowQrCheckIn: true,
    },
  });
  if (!event) notFound();

  const user = await getCurrentUser();
  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(`/event/${id.toString()}/ticket`)}`,
    );
  }

  const eventIdStr = id.toString();
  const ticket = await getMyQrTicket(eventIdStr);

  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
      <nav className="mb-4 text-sm">
        <Link
          href={`/event/${eventIdStr}`}
          className="text-link hover:underline"
        >
          ← イベントに戻る
        </Link>
      </nav>

      <h1 className="text-2xl font-bold text-foreground">参加チケット</h1>
      <p className="mt-1 text-sm text-muted-foreground">{event.title}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {new Date(event.startedAt).toLocaleString("ja-JP")}
        {event.place ? ` / ${event.place}` : ""}
      </p>

      {!ticket.ok ? (
        <div
          className="mt-6 rounded-md border border-border bg-surface p-4 text-sm text-muted-foreground"
          data-testid="ticket-unavailable"
        >
          {ticket.error === "qr_disabled" ? (
            <p>このイベントでは QR チェックインは利用できません。</p>
          ) : (
            <>
              <p>このイベントの参加確定者ではありません。</p>
              <p className="mt-2">
                参加申込は{" "}
                <Link
                  href={`/event/${eventIdStr}`}
                  className="text-link hover:underline"
                >
                  イベントページ
                </Link>{" "}
                から行えます。
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center gap-4 rounded-md border border-border bg-surface p-6">
          {ticket.status === "attended" && (
            <p
              className="w-full rounded-md border border-status-open-fg bg-status-open-bg p-3 text-center text-sm font-semibold text-status-open-fg"
              data-testid="ticket-attended"
            >
              チェックイン済みです
              {ticket.checkInAt && (
                <span className="ml-1 font-normal">
                  ({new Date(ticket.checkInAt).toLocaleString("ja-JP")})
                </span>
              )}
            </p>
          )}

          <TicketQr token={ticket.token} />

          <p className="text-center text-sm text-muted-foreground">
            受付でこの QR コードをスタッフに提示してください。
          </p>

          <div className="w-full">
            <p className="text-xs uppercase text-muted-foreground">参加枠</p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">
              {ticket.roleName}
            </p>
          </div>

          <div className="w-full">
            <p className="text-xs uppercase text-muted-foreground">
              チケットコード (読み取れない場合はスタッフに伝えてください)
            </p>
            <code
              className="mt-1 block break-all rounded bg-background p-2 font-mono text-xs text-foreground"
              data-testid="ticket-token"
            >
              {ticket.token}
            </code>
          </div>
        </div>
      )}
    </div>
  );
}

/** QR SVG 部分 (async Server Component)。生成失敗時はコードのみ表示。 */
async function TicketQr({ token }: { token: string }) {
  const svg = await renderQrSvg(token);
  if (!svg) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="ticket-qr-error">
        QR コードの生成に失敗しました。下のチケットコードをご利用ください。
      </p>
    );
  }
  return (
    <div
      className="rounded-md border border-border bg-white p-2 [&_svg]:block [&_svg]:h-60 [&_svg]:w-60"
      data-testid="ticket-qr"
      role="img"
      aria-label="チェックイン用 QR コード"
      // qrcode-svg がローカル生成した SVG のみを埋め込む (外部入力は含まれない)
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
