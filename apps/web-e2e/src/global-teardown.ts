import fs from "node:fs";
import path from "node:path";

/**
 * Playwright globalTeardown
 *
 * E2E 終了後、globalSetup で取った baseline (`dev.db.baseline`) で `dev.db` を上書き復元する。
 *
 * これにより:
 *   - create-flow.spec.ts のような書き込みテスト後に visual-compare などのスナップショット
 *     ベースのテストが flaky にならない
 *   - ローカルでテストを連続実行しても、シード後の状態が常に再現される
 *
 * 注意:
 *   - baseline ファイルが無い (SKIP_DB_SNAPSHOT=1 が指定されていた等) 場合は何もしない
 *   - SKIP_DB_RESTORE=1 を渡せば復元をスキップ (テスト後の DB を残して調査したい場合)
 */
async function globalTeardown(): Promise<void> {
  if (process.env.SKIP_DB_RESTORE === "1") {
    console.log(
      "[e2e/global-teardown] SKIP_DB_RESTORE=1 → skipping restore (DB state retained)",
    );
    return;
  }

  // Nx 化で dev.db は apps/web/ に配置 (globalSetup と同じ解決)。
  const e2eRoot = path.resolve(__dirname, "..");
  const webRoot = path.resolve(e2eRoot, "../web");
  const dbPath = path.join(webRoot, "dev.db");
  const baselinePath = path.join(webRoot, "dev.db.baseline");

  if (!fs.existsSync(baselinePath)) {
    console.warn(
      "[e2e/global-teardown] dev.db.baseline が無い。復元をスキップ。",
    );
    return;
  }

  const variants = ["", "-wal", "-shm"];
  for (const suffix of variants) {
    const src = baselinePath + suffix;
    const dest = dbPath + suffix;
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    } else if (fs.existsSync(dest)) {
      // baseline 側に無いファイルは clone 後生まれたゴミなので削除
      fs.unlinkSync(dest);
    }
  }

  // baseline 自体は次回の globalSetup で再生成されるので、削除しておく
  for (const suffix of variants) {
    const stale = baselinePath + suffix;
    if (fs.existsSync(stale)) fs.unlinkSync(stale);
  }

  console.log(
    "[e2e/global-teardown] dev.db を baseline から復元しました (clone 前の状態)",
  );
}

export default globalTeardown;
