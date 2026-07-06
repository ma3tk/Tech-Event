/**
 * Outbound Webhook 配信ロジック。
 *
 * `dispatchWebhook(groupId, eventType, payload)` で、対象グループの
 * active な WebhookEndpoint のうち eventType を購読しているものへ
 * JSON を POST する。
 *
 * - 署名: `X-TechEvent-Signature: sha256=<HMAC-SHA256(secret, body)>` (hex)
 *   受信側は保存した secret で body を HMAC して検証できる。
 * - 配信結果は WebhookDelivery に記録する (pending → success | failed)。
 * - 送信失敗・タイムアウト (5s)・SSRF 検証 NG は **握りつぶしてログ + failed 記録**。
 *   呼び出し元 (joinEvent / publishEvent 等) の処理は決して止めない。
 * - SSRF 防御: http(s) のみ + private / loopback / link-local / metadata IP と
 *   localhost 系ホスト名を拒否。redirect は `manual` で追わない
 *   (util-slack の `validateSlackWebhookUrl` と同じ方針。ただしこちらは
 *   任意ホスト宛のため allowlist ではなく denylist ベース)。
 *   ※ DNS rebinding は完全には防げない (fetch 時の再検証は IP リテラルのみ)。
 * - secret はログに一切出力しない。
 */

import { createHmac } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { nextId, withRetry } from "@/lib/id-gen";
import { logger } from "@/lib/logger";

/* ============================================================
 * イベント種別
 * ============================================================ */

/** 配信対象の Webhook イベント種別 (dispatch 箇所があるもののみ列挙) */
export const WEBHOOK_EVENT_TYPES = [
  "guest.registered",
  "event.published",
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

/** 管理 UI 表示用ラベル */
export const WEBHOOK_EVENT_LABELS: Record<WebhookEventType, string> = {
  "guest.registered": "参加申込 (guest.registered)",
  "event.published": "イベント公開 (event.published)",
};

/** 管理 UI で使う一覧アイテム型 (listWebhookEndpoints の戻り値) */
export type WebhookEndpointListItem = {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  secret: string;
  createdAt: Date;
  lastDelivery: {
    eventType: string;
    status: string;
    statusCode: number | null;
    lastAttemptAt: Date | null;
    createdAt: Date;
  } | null;
};

/* ============================================================
 * SSRF 防御 (URL 検証)
 * ============================================================ */

/**
 * private / loopback / link-local / metadata IP 判定 (IPv4 / IPv6 簡易版)。
 * `libs/shared/util-slack/src/slack.ts` の同名実装と同じ判定
 * (同ファイルからは export されていないためここに再掲)。
 */
function isPrivateOrMetadataIp(hostname: string): boolean {
  // IPv6 リテラル
  if (hostname.startsWith("[") && hostname.endsWith("]")) {
    hostname = hostname.slice(1, -1);
  }
  // IPv6
  if (hostname.includes(":")) {
    const lower = hostname.toLowerCase();
    if (lower === "::1" || lower === "::") return true;
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // fc00::/7
    if (lower.startsWith("fe80:") || lower.startsWith("fe80")) return true;
    // IPv4-mapped: ::ffff:127.0.0.1 等
    const m = lower.match(/::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
    if (m) return isPrivateOrMetadataIp(m[1]);
    return false;
  }
  // IPv4
  const parts = hostname.split(".");
  if (parts.length !== 4) return false;
  const oct = parts.map((p) => Number.parseInt(p, 10));
  if (oct.some((n) => !Number.isFinite(n) || n < 0 || n > 255)) return false;
  const [a, b] = oct;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a >= 224) return true; // multicast + reserved
  return false;
}

/**
 * dotted-quad 以外の数値 IP 表記 (10 進整数 / 16 進 / 省略形) を検出する。
 * 例: `http://2130706433/` `http://0x7f000001/` `http://127.1/` は
 * ブラウザ・fetch が 127.0.0.1 に解決するため、まとめて拒否する。
 */
function isNonCanonicalNumericHost(hostname: string): boolean {
  if (!/^[0-9a-fx.]+$/i.test(hostname)) return false;
  const parts = hostname.split(".");
  // 通常の dotted-quad (4 オクテット) は isPrivateOrMetadataIp 側で判定する
  if (parts.length === 4 && parts.every((p) => /^\d{1,3}$/.test(p))) {
    return false;
  }
  return parts.every((p) => p !== "" && /^(0x[0-9a-f]+|\d+)$/i.test(p));
}

/** localhost 系 / 内部専用 TLD のホスト名 (denylist) */
function isForbiddenHostname(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/\.$/, "");
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (h.endsWith(".local")) return true;
  if (h.endsWith(".internal")) return true;
  if (h.endsWith(".home.arpa")) return true;
  if (h === "metadata.google.internal") return true;
  return false;
}

export type OutboundWebhookUrlValidation =
  | { ok: true; url: URL }
  | { ok: false; error: string };

/**
 * Outbound Webhook 用の URL を検証する (SSRF ガード)。
 *
 * - `http:` / `https:` のみ許可 (それ以外のスキームは拒否)
 * - URL 埋め込み認証情報 (user:pass@) は拒否
 * - localhost / `.local` / `.internal` 等の内部ホスト名は拒否
 * - private / loopback / link-local / metadata IP リテラル
 *   (10 進 / 16 進 / 省略形の変種を含む) は拒否
 *
 * 失敗時の `error` はそのまま UI に表示できる日本語メッセージ。
 */
export function validateOutboundWebhookUrl(
  url: string | null | undefined,
): OutboundWebhookUrlValidation {
  if (!url || typeof url !== "string") {
    return { ok: false, error: "URL を入力してください" };
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: "URL の形式が不正です" };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "http / https の URL のみ登録できます" };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, error: "認証情報付き URL は登録できません" };
  }
  const hostname = parsed.hostname.toLowerCase();
  if (!hostname) {
    return { ok: false, error: "URL の形式が不正です" };
  }
  if (
    isForbiddenHostname(hostname) ||
    isNonCanonicalNumericHost(hostname) ||
    isPrivateOrMetadataIp(hostname)
  ) {
    return {
      ok: false,
      error: "localhost / プライベート IP 宛の URL は登録できません",
    };
  }
  return { ok: true, url: parsed };
}

/* ============================================================
 * 配信
 * ============================================================ */

const WEBHOOK_TIMEOUT_MS = 5_000;

type EndpointRow = {
  id: bigint;
  url: string;
  secret: string;
  events: string;
};

/**
 * 1 エンドポイントへの配信 + WebhookDelivery 記録。
 *
 * 失敗しても throw しない (ログ + status=failed 記録のみ)。
 */
async function deliverToEndpoint(
  endpoint: EndpointRow,
  eventType: WebhookEventType,
  body: string,
): Promise<void> {
  // pending 行を先に作成しておく (送信途中でプロセスが落ちても監査痕跡が残る)
  let deliveryId: bigint | null = null;
  try {
    deliveryId = await withRetry(() =>
      prisma.$transaction(async (tx) => {
        const id = await nextId(tx, "webhookDelivery");
        await tx.webhookDelivery.create({
          data: {
            id,
            endpointId: endpoint.id,
            eventType,
            payload: body,
            status: "pending",
          },
        });
        return id;
      }),
    );
  } catch (e) {
    logger.warn(
      {
        endpointId: endpoint.id.toString(),
        eventType,
        err: e instanceof Error ? e.message : String(e),
      },
      "webhook delivery record create failed",
    );
  }

  let status: "success" | "failed" = "failed";
  let statusCode: number | null = null;
  let errorNote: string | null = null;

  // 送信直前にも SSRF 再検証 (登録後に検証ロジックが強化された場合の保険)
  const v = validateOutboundWebhookUrl(endpoint.url);
  if (!v.ok) {
    errorNote = `url_validation_failed: ${v.error}`;
  } else {
    try {
      const signature = createHmac("sha256", endpoint.secret)
        .update(body)
        .digest("hex");
      const res = await fetch(v.url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "tech-event-webhook/1.0",
          "X-TechEvent-Event": eventType,
          "X-TechEvent-Signature": `sha256=${signature}`,
        },
        body,
        // 30x で内部ホストへ誘導される SSRF を防ぐ (util-slack と同方針)
        redirect: "manual",
        signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
      });
      statusCode = res.status;
      if (res.ok) status = "success";
    } catch (e) {
      // タイムアウト (TimeoutError) / DNS 失敗 / 接続拒否など
      errorNote = e instanceof Error ? e.message : String(e);
    }
  }

  if (deliveryId != null) {
    try {
      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status,
          statusCode,
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
        },
      });
    } catch (e) {
      logger.warn(
        {
          endpointId: endpoint.id.toString(),
          deliveryId: deliveryId.toString(),
          err: e instanceof Error ? e.message : String(e),
        },
        "webhook delivery record update failed",
      );
    }
  }

  if (status !== "success") {
    // NOTE: secret は絶対にログへ出さない
    logger.warn(
      {
        endpointId: endpoint.id.toString(),
        eventType,
        statusCode,
        err: errorNote,
      },
      "webhook delivery failed",
    );
  }
}

/**
 * dispatchWebhook: 指定グループの購読エンドポイントへ eventType を配信する。
 *
 * - 呼び出し元の DB commit 後に呼ぶこと (トランザクション内では呼ばない)。
 * - どのエンドポイントで失敗しても throw しない (fire-and-forget semantics)。
 * - payload は JSON 化できる値のみ (BigInt は事前に `.toString()` すること)。
 */
export async function dispatchWebhook(
  groupId: bigint,
  eventType: WebhookEventType,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: { groupId, active: true },
      select: { id: true, url: true, secret: true, events: true },
    });
    const subscribed = endpoints.filter((ep) =>
      ep.events
        .split(",")
        .map((s) => s.trim())
        .includes(eventType),
    );
    if (subscribed.length === 0) return;

    const body = JSON.stringify({
      type: eventType,
      createdAt: new Date().toISOString(),
      data: payload,
    });

    for (const ep of subscribed) {
      await deliverToEndpoint(ep, eventType, body);
    }
  } catch (e) {
    // 配信ロジック全体の失敗も呼び出し元へは伝播させない
    logger.warn(
      {
        groupId: groupId.toString(),
        eventType,
        err: e instanceof Error ? e.message : String(e),
      },
      "webhook dispatch failed",
    );
  }
}
