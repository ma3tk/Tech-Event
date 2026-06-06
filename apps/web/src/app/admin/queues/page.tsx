/**
 * /admin/queues — 管理者用キュー監視ページ。
 *
 * iframe で `/api/admin/queues/dashboard` (Bull Board UI) を埋め込む。
 *
 * 認可:
 *   - 認証必須。
 *   - role=admin or role=organizer のみ。それ以外は 403 ページにリダイレクト。
 *   - Redis 未設定環境では「Redis 未設定」のメッセージを表示。
 */
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isRedisEnabled } from "@tech-event/shared-data-access-queue";

export const dynamic = "force-dynamic";

export default async function AdminQueuesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/admin/queues");
  }
  const role = (user as { role?: string }).role;
  if (role !== "admin" && role !== "organizer") {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold">403 Forbidden</h1>
        <p className="mt-4">この画面は管理者専用です。</p>
      </main>
    );
  }

  if (!isRedisEnabled()) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold">キュー監視ダッシュボード</h1>
        <p className="mt-4 text-amber-700">
          <code>REDIS_URL</code> が未設定のため、キューは inline 実行モードで動いています。
          ダッシュボードを表示するには <code>REDIS_URL</code> を設定してアプリを再起動してください。
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">キュー監視ダッシュボード</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Bull Board: participation / notification / lottery キューの可視化・リトライ・削除。
      </p>
      <iframe
        title="Bull Board"
        src="/api/admin/queues/dashboard"
        className="w-full border rounded"
        style={{ height: "80vh" }}
      />
    </main>
  );
}
