/**
 * Slack Incoming Webhook 送信ヘルパ。
 *
 * - `sendSlackWebhook(url, payload)` で POST 送信する。
 *   - URL が空文字または `https://` でなければ送信せず no-op を返す。
 *   - 失敗しても呼び出し元には throw せず、`{ ok: false, error }` を返す。
 *     (主催者が webhook URL を typo していても他の処理を巻き込まないため)
 * - Slack Incoming Webhook の典型 payload 構造に合わせ、
 *   `text` 必須・`blocks` 任意で受け取る。
 * - `notifyEventPublished` / `notifyCommentPosted` / `notifyLotteryResult` の
 *   3 種類の高レベル通知関数を提供。
 *
 * 設計メモ:
 *   - Group.slackWebhookUrl が未設定 (null/空) のときは「全く送らない」のが原則。
 *   - 失敗時もエラーをログに残すだけで、呼び出し元のトランザクションは止めない。
 *   - 開発時 / E2E では `globalThis.fetch` を spyOn できるよう、グローバルな
 *     `fetch` を直接呼ぶ。
 */

export type SlackBlock = Record<string, unknown>;

export type SlackPayload = {
  text: string;
  blocks?: SlackBlock[];
  username?: string;
  icon_emoji?: string;
};

export type SlackResult = { ok: boolean; status?: number; error?: string };

/**
 * private / loopback / link-local / metadata IP 判定 (IPv4 / IPv6 簡易版)。
 *
 * - 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16, 127.0.0.0/8
 * - 0.0.0.0/8, 100.64.0.0/10 (CGNAT), 198.18.0.0/15
 * - 169.254.169.254 (AWS / GCP / Azure IMDS)
 * - IPv6: ::1, fc00::/7, fe80::/10, ::ffff:... マッピングは別チェック
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
 * Slack Webhook URL を検証する (SSRF ガード)。
 *
 * - https のみ許可
 * - host は `hooks.slack.com` allowlist
 *   - ただし `SLACK_WEBHOOK_ALLOW_TEST_HOSTS=1` のときは `localhost` / 127.0.0.1 も許可
 *     (E2E テスト・slack-catcher 用)。
 * - private / metadata IP リテラルは拒否
 *
 * 戻り値: ok=true で URL オブジェクト、ok=false でエラーキー。
 */
export function validateSlackWebhookUrl(
  url: string | null | undefined,
): { ok: true; url: URL } | { ok: false; error: string } {
  if (!url || typeof url !== "string") return { ok: false, error: "no_url" };
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: "invalid_url" };
  }

  const allowTestHosts =
    process.env.SLACK_WEBHOOK_ALLOW_TEST_HOSTS === "1" ||
    process.env.NODE_ENV === "test";

  const hostname = parsed.hostname.toLowerCase();

  // テストホストの許可 (slack-catcher 用)
  if (allowTestHosts) {
    const allowedTestHosts = new Set([
      "localhost",
      "127.0.0.1",
      "[::1]",
      "::1",
    ]);
    if (allowedTestHosts.has(hostname)) {
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return { ok: false, error: "invalid_protocol" };
      }
      return { ok: true, url: parsed };
    }
  }

  // 本番: https + hooks.slack.com のみ
  if (parsed.protocol !== "https:") {
    return { ok: false, error: "https_required" };
  }
  if (hostname !== "hooks.slack.com") {
    return { ok: false, error: "host_not_allowed" };
  }
  // hooks.slack.com 自体は DNS rebinding 攻撃の恐れはあるが、最低限 IP リテラル偽装を弾く。
  if (isPrivateOrMetadataIp(hostname)) {
    return { ok: false, error: "private_ip_blocked" };
  }
  // path は /services/ で始まることが Slack 公式の仕様
  if (!parsed.pathname.startsWith("/services/")) {
    return { ok: false, error: "invalid_slack_path" };
  }
  return { ok: true, url: parsed };
}

/** Slack Incoming Webhook を 1 件送信 */
export async function sendSlackWebhook(
  url: string | null | undefined,
  payload: SlackPayload,
): Promise<SlackResult> {
  const v = validateSlackWebhookUrl(url);
  if (!v.ok) return { ok: false, error: v.error };
  try {
    const res = await fetch(v.url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // redirect は手動で扱い、external host への 30x で SSRF を防ぐ
      redirect: "manual",
    });
    if (!res.ok) {
      return { ok: false, status: res.status, error: `http_${res.status}` };
    }
    return { ok: true, status: res.status };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/* ------------------------------------------------------------
 * 高レベルヘルパ
 * ------------------------------------------------------------ */

function buildEventUrl(eventId: bigint | string): string {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ??
    process.env.BASE_URL ??
    "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/event/${eventId.toString()}`;
}

export type NotifyEventPublishedInput = {
  webhookUrl: string | null | undefined;
  eventId: bigint | string;
  title: string;
  groupName: string;
  startedAt: Date;
};

/** イベント公開通知 */
export async function notifyEventPublished(
  input: NotifyEventPublishedInput,
): Promise<SlackResult> {
  const url = buildEventUrl(input.eventId);
  const text = `:rocket: 新しいイベントが公開されました\n*<${url}|${input.title}>*\n${input.groupName} / ${input.startedAt.toISOString()}`;
  return sendSlackWebhook(input.webhookUrl, {
    text,
    blocks: [
      {
        type: "section",
        text: { type: "mrkdwn", text },
      },
    ],
  });
}

export type NotifyCommentPostedInput = {
  webhookUrl: string | null | undefined;
  eventId: bigint | string;
  eventTitle: string;
  authorDisplayName: string;
  bodyExcerpt: string;
};

/** コメント投稿通知 */
export async function notifyCommentPosted(
  input: NotifyCommentPostedInput,
): Promise<SlackResult> {
  const url = buildEventUrl(input.eventId);
  // body は 200 文字で切る (privacy 考慮)
  const excerpt =
    input.bodyExcerpt.length > 200
      ? input.bodyExcerpt.slice(0, 200) + "…"
      : input.bodyExcerpt;
  const text = `:speech_balloon: <${url}|${input.eventTitle}> に新しいコメント (${input.authorDisplayName})\n> ${excerpt.replace(/\n/g, "\n> ")}`;
  return sendSlackWebhook(input.webhookUrl, { text });
}

export type NotifyLotteryResultInput = {
  webhookUrl: string | null | undefined;
  eventId: bigint | string;
  eventTitle: string;
  acceptedCount: number;
  waitingCount: number;
};

/** 抽選結果発表通知 */
export async function notifyLotteryResult(
  input: NotifyLotteryResultInput,
): Promise<SlackResult> {
  const url = buildEventUrl(input.eventId);
  const text = `:tada: 抽選結果が確定しました\n*<${url}|${input.eventTitle}>*\n当選: ${input.acceptedCount}名 / 補欠: ${input.waitingCount}名`;
  return sendSlackWebhook(input.webhookUrl, { text });
}
