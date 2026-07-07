/**
 * Web Push 送信ヘルパー。
 *
 * `sendWebPush(userId, payload)` — そのユーザーの `PushSubscription` 全件へ
 * push 通知を送信する。
 *
 * `web-push` パッケージは **dynamic import** で読み込む (mailer.ts の
 * nodemailer / resend と同じパターン)。以下のいずれかの場合は送信せず
 * console フォールバック (`{ delivered: false }`) で終了する:
 *
 *   - `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` 未設定
 *   - `web-push` パッケージ未インストール (import 失敗)
 *
 * これによりパッケージ未追加でも型 / ビルドが通り、後から
 * `pnpm add web-push` + VAPID env 設定だけで実配信を有効化できる。
 *
 * VAPID キーの生成 (有効化するとき):
 *   npx web-push generate-vapid-keys
 *   # .env に VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY /
 *   #        VAPID_SUBJECT (mailto: or https URL) /
 *   #        NEXT_PUBLIC_VAPID_PUBLIC_KEY (= VAPID_PUBLIC_KEY と同値) を設定
 *
 * セキュリティ: VAPID private key は **絶対にログ出力しない**。
 * 410 Gone / 404 Not Found を返した endpoint (購読失効) は DB から削除する。
 */

import { prisma } from "@/lib/prisma";

/** push 通知ペイロード。sw.js の push ハンドラ (event.data.json()) が受け取る形。 */
export interface WebPushPayload {
  title: string;
  body?: string;
  /** notificationclick で開く same-origin パス (例: `/event/123`) */
  url?: string;
}

export interface SendWebPushResult {
  /** 1 件以上実送信できたら true。フォールバック / 購読 0 件は false。 */
  delivered: boolean;
  /** 実送信に成功した購読数 */
  sent: number;
  /** 送信に失敗した購読数 (失効削除を含む) */
  failed: number;
  /** delivered=false のときの理由 (debug 用) */
  reason?: string;
}

/**
 * `web-push` パッケージの利用箇所のみの最小型。
 * パッケージ未インストールでも typecheck が通るようにローカル定義する。
 */
interface WebPushModule {
  setVapidDetails(
    subject: string,
    publicKey: string,
    privateKey: string,
  ): void;
  sendNotification(
    subscription: {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    },
    payload?: string,
  ): Promise<{ statusCode: number }>;
}

/** web-push が送信失敗時に投げるエラー (statusCode 付き) の duck-typing。 */
function getStatusCode(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  const code = (err as { statusCode?: unknown }).statusCode;
  return typeof code === "number" ? code : undefined;
}

/** module キャッシュ: undefined=未試行 / null=import 失敗 (未インストール) */
let _webPush: WebPushModule | null | undefined;

/**
 * `web-push` を dynamic import する。未インストールなら null。
 *
 * NOTE: specifier を変数にして bundler (webpack / Turbopack) の静的解決を
 * 回避する。literal `import("web-push")` だとパッケージ未インストール時に
 * ビルドが Module not found で落ちるため。
 */
async function loadWebPush(): Promise<WebPushModule | null> {
  if (_webPush !== undefined) return _webPush;
  try {
    const specifier = "web-push";
    const mod = (await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ specifier)) as
      | (WebPushModule & { default?: WebPushModule })
      | undefined;
    _webPush = mod?.default ?? mod ?? null;
  } catch {
    _webPush = null;
  }
  return _webPush;
}

/** VAPID 設定 (private key は返すだけでログには一切出さない)。 */
function resolveVapid(): {
  publicKey: string;
  privateKey: string;
  subject: string;
} | null {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return null;
  const subject = process.env.VAPID_SUBJECT || "mailto:noreply@tech-event.local";
  return { publicKey, privateKey, subject };
}

/**
 * console フォールバック (mailer.ts の `sendViaConsole` と同思想)。
 * payload の内容のみログし、キー類は出力しない。
 */
function sendViaConsole(
  userId: bigint,
  payload: WebPushPayload,
  reason: string,
): SendWebPushResult {
  const tag = `push:fallback:${reason}`;
  console.log(`[${tag}] userId=${userId}`);
  console.log(`[${tag}] title=${payload.title}`);
  if (payload.body) console.log(`[${tag}] body=${payload.body}`);
  if (payload.url) console.log(`[${tag}] url=${payload.url}`);
  return { delivered: false, sent: 0, failed: 0, reason };
}

/**
 * Web Push が実配信可能な構成か (VAPID env が揃っているか)。
 * `web-push` パッケージの有無はここでは見ない (import は送信時に判定)。
 */
export function isWebPushConfigured(): boolean {
  return resolveVapid() !== null;
}

/**
 * 指定ユーザーの全 PushSubscription へ push 通知を送信する。
 *
 * - VAPID 未設定 / `web-push` 未インストール → console フォールバック
 * - 410 / 404 を返した endpoint は失効とみなして DB から削除
 * - 送信は購読ごとに独立 (1 件の失敗が他を止めない)
 */
export async function sendWebPush(
  userId: bigint,
  payload: WebPushPayload,
): Promise<SendWebPushResult> {
  const vapid = resolveVapid();
  if (!vapid) {
    return sendViaConsole(userId, payload, "vapid_unconfigured");
  }

  const webPush = await loadWebPush();
  if (!webPush) {
    return sendViaConsole(userId, payload, "module_unavailable");
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
    select: { endpoint: true, p256dh: true, auth: true },
  });
  if (subscriptions.length === 0) {
    return { delivered: false, sent: 0, failed: 0, reason: "no_subscriptions" };
  }

  webPush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

  const body = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;
  const expiredEndpoints: string[] = [];

  for (const sub of subscriptions) {
    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        body,
      );
      sent += 1;
    } catch (err) {
      failed += 1;
      const status = getStatusCode(err);
      if (status === 404 || status === 410) {
        // 購読失効 → DB から掃除する (endpoint はログに全文出さない)
        expiredEndpoints.push(sub.endpoint);
      } else {
        console.error(
          `[push:error] userId=${userId} status=${status ?? "unknown"}`,
        );
      }
    }
  }

  if (expiredEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: expiredEndpoints } },
    });
    console.log(
      `[push:cleanup] userId=${userId} expired=${expiredEndpoints.length}`,
    );
  }

  return { delivered: sent > 0, sent, failed };
}

/** テスト用: module キャッシュをリセットする (mailer.ts と同様のフック)。 */
export function resetWebPushCacheForTesting(): void {
  _webPush = undefined;
}
