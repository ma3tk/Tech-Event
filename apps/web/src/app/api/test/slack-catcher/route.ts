/**
 * E2E 用 Slack Webhook キャッチャ。
 *
 * - `POST /api/test/slack-catcher?token=<token>` で送られてきた JSON を
 *   プロセス内メモリに蓄積する。
 * - `GET  /api/test/slack-catcher?token=<token>` で蓄積された呼び出しを参照。
 * - `DELETE /api/test/slack-catcher?token=<token>` でクリア。
 *
 * 本番では disable (NODE_ENV === "production" のとき 404)。
 */
import { NextResponse, type NextRequest } from "next/server";

type Record = {
  token: string;
  receivedAt: string;
  body: unknown;
};

// プロセス間で共有する単純なメモリストア。
// dev/test の単一プロセスでのみ動くことを前提とする。
const STORE: Map<string, Record[]> = (() => {
  const g = globalThis as { __slackCatcherStore?: Map<string, Record[]> };
  if (!g.__slackCatcherStore) {
    g.__slackCatcherStore = new Map();
  }
  return g.__slackCatcherStore;
})();

/**
 * 2 段ガード: production では常に 404。
 * 非 production でも `ENABLE_TEST_ENDPOINTS=1` のときのみ有効。
 */
function isDisabled(): boolean {
  if (process.env.NODE_ENV === "production") return true;
  return process.env.ENABLE_TEST_ENDPOINTS !== "1";
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (isDisabled()) return new NextResponse("Not Found", { status: 404 });
  const token = request.nextUrl.searchParams.get("token") ?? "default";
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = await request.text();
  }
  const list = STORE.get(token) ?? [];
  list.push({ token, receivedAt: new Date().toISOString(), body });
  STORE.set(token, list);
  return NextResponse.json({ ok: true, count: list.length });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (isDisabled()) return new NextResponse("Not Found", { status: 404 });
  const token = request.nextUrl.searchParams.get("token") ?? "default";
  const list = STORE.get(token) ?? [];
  return NextResponse.json({ token, count: list.length, records: list });
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  if (isDisabled()) return new NextResponse("Not Found", { status: 404 });
  const token = request.nextUrl.searchParams.get("token") ?? "default";
  STORE.delete(token);
  return NextResponse.json({ ok: true });
}
