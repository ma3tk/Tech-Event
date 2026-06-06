/**
 * Bull Board ダッシュボードを Next.js Route Handler 上でホストする。
 *
 * URL: `/api/admin/queues/dashboard/...`
 *
 * 認可:
 *   - 認証必須 (te_session)。
 *   - role=admin or role=organizer のみ。それ以外は 403。
 *
 * 実装:
 *   - Bull Board の H3 アダプタを使い、createApp() に Router をマウント。
 *   - h3 の `toWebHandler` で Next.js の Web Request を直接処理する。
 *   - Redis 未設定なら 503 (dashboard は起動しない)。
 *
 * NOTE: Next.js 16 の Route Handler は Edge / Node 両方で動作するが、本 endpoint は
 * Node runtime 必須 (ejs / fs アクセスを伴う)。明示的に `runtime = "nodejs"` を指定。
 */
import { NextResponse } from "next/server";

import { createApp, toWebHandler, toEventHandler } from "h3";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { H3Adapter } from "@bull-board/h3";

import { getCurrentUser } from "@/lib/auth";
import {
  isRedisEnabled,
  getQueue,
  QUEUE_NAMES,
} from "@tech-event/shared-data-access-queue";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BASE_PATH = "/api/admin/queues/dashboard";

let _handler: ((request: Request) => Promise<Response>) | null = null;

function buildHandler() {
  if (_handler) return _handler;

  const serverAdapter = new H3Adapter();
  serverAdapter.setBasePath(BASE_PATH);

  const queues = [
    getQueue(QUEUE_NAMES.participation),
    getQueue(QUEUE_NAMES.notification),
    getQueue(QUEUE_NAMES.lottery),
  ].filter((q): q is NonNullable<typeof q> => q != null);

  createBullBoard({
    queues: queues.map((q) => new BullMQAdapter(q)),
    serverAdapter,
  });

  const app = createApp();
  // H3Adapter.registerHandlers() は h3 v1 の Router を返す。
  // Router 自体は EventHandler として use できる。
  app.use(toEventHandler(serverAdapter.registerHandlers().handler));

  _handler = toWebHandler(app);
  return _handler;
}

async function authorize(): Promise<NextResponse | null> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  // role フィールドは User モデル側に存在しないケースもあるため duck-typing。
  // organizer (= 何かしらの Group の admin) も許可。
  const role = (user as { role?: string }).role;
  const isAdmin = role === "admin" || role === "organizer";
  if (!isAdmin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return null;
}

async function handle(request: Request): Promise<Response> {
  if (!isRedisEnabled()) {
    return NextResponse.json(
      { error: "redis_not_configured" },
      { status: 503 },
    );
  }
  const denied = await authorize();
  if (denied) return denied;
  const handler = buildHandler();
  return handler(request);
}

export async function GET(request: Request): Promise<Response> {
  return handle(request);
}
export async function POST(request: Request): Promise<Response> {
  return handle(request);
}
export async function PUT(request: Request): Promise<Response> {
  return handle(request);
}
export async function DELETE(request: Request): Promise<Response> {
  return handle(request);
}
export async function PATCH(request: Request): Promise<Response> {
  return handle(request);
}
