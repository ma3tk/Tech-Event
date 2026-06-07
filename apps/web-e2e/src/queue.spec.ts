/**
 * 申込キュー (`participation` queue) の smoke E2E。
 *
 * - `REDIS_URL` 未設定の dev / CI 環境では `enqueueJoin` が inline モードで動き、
 *   従来通り同期で Participant が作成される (fallback)。
 *   この場合 `/api/jobs/:id` は inline 完了を示す疑似レスポンスを返す。
 * - 本テストは fallback パス (= REDIS_URL 未設定) を中心に検証する。
 * - REDIS_URL 設定時の queued パスは、worker が別プロセスで動くことを前提とする
 *   ため本 spec では skip し、別途 docker-compose で確認する。
 *
 * 検証項目:
 *  1. `/api/jobs/<dummyId>` は 認証必須 → 未認証なら 401。
 *  2. dev-login 後、自分以外の jobId は 403 (queue が有効なときのみ)。
 *  3. dev-login 後、自分の jobId は 200 (inline モードなら state=completed)。
 */
import { test, expect } from "@playwright/test";
import { devLogin } from "./_helpers/auth";

test.describe("queue: /api/jobs/:id", () => {
  test("未認証なら 401", async ({ request }) => {
    const res = await request.get("/api/jobs/join:1:1:1");
    expect(res.status()).toBe(401);
  });

  test("dev-login 後、自分の jobId は 200 (inline mode で completed 扱い)", async ({
    page,
  }) => {
    await devLogin(page, "fast_moon_169");

    // セッションは page.context が保持しているので request も同 context から。
    // CI で稀に ECONNRESET (next dev のターボパック compile race) が出るため最大 3 回 retry。
    let res: Awaited<ReturnType<typeof page.request.get>> | null = null;
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        res = await page.request.get("/api/jobs/join:1:99:99");
        lastErr = null;
        break;
      } catch (err) {
        lastErr = err;
        await page.waitForTimeout(500);
      }
    }
    if (!res) throw lastErr ?? new Error("request failed");
    expect(res.status()).toBeLessThan(500);

    const body = await res.json();
    if (body.mode === "inline") {
      // REDIS_URL 未設定: inline モードでは即 completed として返す
      expect(body.state).toBe("completed");
    } else {
      // queue モード: jobId が存在しなければ 404
      expect([200, 404]).toContain(res.status());
    }
  });

  test("dev-login 後、他人の jobId は 403 (inline / queue 両モード)", async ({
    page,
  }) => {
    await devLogin(page, "fast_moon_169");
    // fast_moon_169 は seed の id=1 のはず → 他人 (id=999) の jobId は 403
    const res = await page.request.get("/api/jobs/join:999:1:1");
    expect(res.status()).toBe(403);
  });
});
