/**
 * ユーザーフォロー機能の E2E。
 *
 * - dev-login `test_user` で他ユーザーのプロフィールを開き、
 *   フォロー → Followers 数が +1 → 解除 → 元に戻る、を検証する。
 * - プロフィールの Going タブ (公開参加予定: accepted × 未来 × public) の表示を検証する。
 * - 未ログイン時はフォローボタンの代わりに /login 誘導リンクが出ることを検証する。
 *
 * followee はシードユーザーを使う。desktop / mobile の 2 project が同一 dev.db を
 * 並列で叩くため、project ごとに followee を分けてカウンタの読み合い flake を防ぐ。
 * (`wild_ocean_589` / `happy_river_200` はどちらも未来の公開イベントに accepted
 *  参加しているシードユーザーで、他 spec の固定ユーザーとは干渉しない。)
 *
 * followUser / unfollowUser は冪等 (既フォロー / 未フォローは no-op) なので、
 * clickUntil のリトライ click で二重送信になってもカウンタは壊れない。
 */
import path from "node:path";
import Database from "better-sqlite3";
import { test, expect, type Page } from "@playwright/test";
import { devLoginLegacy as devLogin } from "./_helpers/auth";
import { clickUntil } from "./_helpers/actions";

const FOLLOWER = "test_user";
const DEV_DB_PATH = path.resolve(__dirname, "../../web/dev.db");

/**
 * followee は seed.ts が Math.random で生成する非決定的な nickname のため
 * ハードコードできない (CI の fresh db:reset で存在しない)。実行時に dev.db から
 * 実在する active ユーザー (test_user 以外) を 2 名取得し、project ごとに割り当てて
 * desktop / mobile の並列カウンタ衝突を避ける。
 */
function resolveFollowees(): { desktop: string; mobile: string } {
  const db = new Database(DEV_DB_PATH, { readonly: true });
  try {
    const rows = db
      .prepare(
        "SELECT nickname FROM users WHERE nickname != ? AND status = 'active' ORDER BY id LIMIT 2",
      )
      .all("test_user") as { nickname: string }[];
    const desktop = rows[0]?.nickname ?? "test_user";
    const mobile = rows[1]?.nickname ?? desktop;
    return { desktop, mobile };
  } finally {
    db.close();
  }
}

const FOLLOWEES = resolveFollowees();

function followeeFor(projectName: string): string {
  return projectName === "chromium-mobile"
    ? FOLLOWEES.mobile
    : FOLLOWEES.desktop;
}

/** `user-followers-count` の表示テキストから数値を読む (例: "1,234 フォロワー") */
async function readFollowersCount(page: Page): Promise<number> {
  const link = page.getByTestId("user-followers-count");
  await expect(link).toBeVisible();
  const text = (await link.innerText()).replace(/[^\d]/g, "");
  expect(text.length).toBeGreaterThan(0);
  return Number.parseInt(text, 10);
}

/**
 * フォロー対象ページを開き、認証済み状態 (follow-button 表示) が確立するまで待つ。
 * フルスイート並列 (CI) では dev-login の session cookie 反映が navigation に間に合わず
 * 未認証描画 (follow-login-link) になることがあるため、reload リトライで整地する。
 */
async function gotoFolloweeAuthed(page: Page, followee: string): Promise<void> {
  await expect(async () => {
    await page.goto(`/user/${followee}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("follow-button")).toBeVisible({
      timeout: 3000,
    });
  }).toPass({ timeout: 20_000 });
}

/**
 * フォロー状態を「未フォロー」に整地する (テスト前提の掃除)。
 * follow-button が data-following="true" なら解除 click して false になるまで待つ。
 */
async function ensureNotFollowing(page: Page, followee: string): Promise<void> {
  await gotoFolloweeAuthed(page, followee);
  const btn = page.getByTestId("follow-button");
  if ((await btn.getAttribute("data-following")) !== "true") return;
  await clickUntil(btn, async () => {
    await expect(page.getByTestId("follow-button")).toHaveAttribute(
      "data-following",
      "false",
    );
  });
}

// 同一ユーザー (test_user) のフォロー状態を共有するため、ファイル内は serial。
test.describe.configure({ mode: "serial" });

test.describe("ユーザーフォロー", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("フォロー → Followers 数が増加 → 解除で元に戻る", async (
    { page },
    testInfo,
  ) => {
    const followee = followeeFor(testInfo.project.name);
    await devLogin(page, FOLLOWER, `/user/${followee}`);

    // 前提: 未フォロー状態に整地
    await ensureNotFollowing(page, followee);
    const before = await readFollowersCount(page);

    // ---- フォロー ----
    const followBtn = page.getByTestId("follow-button");
    await expect(followBtn).toHaveAttribute("data-following", "false");
    await clickUntil(followBtn, async () => {
      await expect(page.getByTestId("follow-button")).toHaveAttribute(
        "data-following",
        "true",
      );
    });

    // Followers 数が +1 されている (Server Action + revalidate 後の再描画を待つ)
    await expect(async () => {
      expect(await readFollowersCount(page)).toBe(before + 1);
    }).toPass();

    // followers 一覧ページにも follower (test_user) が出る
    await page.goto(`/user/${followee}/followers`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByTestId("followers-list")).toBeVisible();
    await expect(
      page
        .getByTestId("followers-list")
        .locator(`a[href="/user/${FOLLOWER}"]`),
    ).toBeVisible();

    // ---- フォロー解除 ----
    await gotoFolloweeAuthed(page, followee);
    const unfollowBtn = page.getByTestId("follow-button");
    await expect(unfollowBtn).toHaveAttribute("data-following", "true");
    await clickUntil(unfollowBtn, async () => {
      await expect(page.getByTestId("follow-button")).toHaveAttribute(
        "data-following",
        "false",
      );
    });

    // Followers 数が元に戻っている
    await expect(async () => {
      expect(await readFollowersCount(page)).toBe(before);
    }).toPass();
  });

  test("Going タブに公開参加予定イベントが表示される", async (
    { page },
    testInfo,
  ) => {
    const followee = followeeFor(testInfo.project.name);

    // Going タブは公開情報なので未ログインでも閲覧できる
    await page.goto(`/user/${followee}?view=classic&tab=going`, {
      waitUntil: "domcontentloaded",
    });

    // タブナビに「参加予定 (Going)」タブがあり、選択されている
    const goingTab = page.getByRole("tab", { name: "参加予定 (Going)" });
    await expect(goingTab).toBeVisible();
    await expect(goingTab).toHaveAttribute("aria-selected", "true");

    // パネルが表示され、未来の公開イベントが 1 件以上並ぶ
    const panel = page.getByTestId("user-going-panel");
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("heading", { level: 2 })).toContainText(
      "参加予定 (Going)",
    );
    const list = page.getByTestId("user-going-list");
    await expect(list).toBeVisible();
    expect(await list.locator("li").count()).toBeGreaterThan(0);
  });

  test("未ログイン時はフォローボタンの代わりに login 誘導リンクが出る", async (
    { page },
    testInfo,
  ) => {
    const followee = followeeFor(testInfo.project.name);
    await page.goto(`/user/${followee}`, { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("follow-button")).toHaveCount(0);
    const loginLink = page.getByTestId("follow-login-link");
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute(
      "href",
      `/login?next=${encodeURIComponent(`/user/${followee}`)}`,
    );
  });
});
