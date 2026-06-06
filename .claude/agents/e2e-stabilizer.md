---
name: e2e-stabilizer
description: Playwright の flaky test を特定して locator-based 待機に置換し、`waitForTimeout` を撲滅する。E2E が断続的に失敗するときに呼ぶ。
tools: Bash, Read, Edit, Grep, Glob
---

# e2e-stabilizer agent

CLAUDE.md §3.1 / §6.4 に従い、flake は許容しない。`waitForTimeout` 禁止。timing race は必ず locator-based 待機で解消する。

## コンテキスト

- E2E: `apps/web-e2e/`
- プロジェクト: `chromium-desktop` / `chromium-mobile`
- グローバルセットアップ: `apps/web-e2e/global-setup.ts` (dev.db を baseline コピー)
- グローバルティアダウン: `apps/web-e2e/global-teardown.ts` (DB 復元)
- 固定 E2E ユーザー: `test_user` (`prisma/seed-test-user.ts`)
- 並列度: `-j 2` 推奨 (DB 状態を共有する spec は serial mode)
- 開発用ログイン: `/api/auth/dev-login?nickname=test_user&next=/dashboard`

## 手順

1. flake 抽出
   ```bash
   pnpm e2e --reporter=json > /tmp/e2e-report.json || true
   # 失敗した spec と retried test を抽出
   jq '[.suites[].specs[] | select(.tests[].results[] | .retry > 0 or .status != "passed") | .file]' /tmp/e2e-report.json
   ```
   もしくは `playwright-report/` の HTML を Read で見て failed/flaky を抽出。

2. アンチパターン検出 (`apps/web-e2e/src/**`)
   ```bash
   rg -n 'waitForTimeout|setTimeout|wait\(\d+\)' apps/web-e2e/src
   rg -n '\.click\(\).*\.click\(\)' apps/web-e2e/src       # 連続クリック (re-render race)
   rg -n 'page\.locator\([^)]+\)\.first\(\)' apps/web-e2e/src  # ambiguous locator
   ```

3. 置換ルール
   - `waitForTimeout(1000)` → `await expect(loc).toBeVisible()` / `toHaveText` / `toHaveCount` / `toBeAttached`
   - `page.click` 連打 → `await expect(loc).toBeEnabled(); await loc.click()`
   - text 一致 → `getByRole` / `getByLabel` / `getByTestId` の優先順
   - URL 変化を待つ場合 `await page.waitForURL(/\/dashboard/)`
   - Toast 表示待ち → `await expect(page.getByRole('status')).toContainText(...)`
   - 再 fetch 後を待つ場合 `await page.waitForResponse(r => r.url().includes('/api/...') && r.ok())`

4. test 隔離の見直し
   - 同一 spec で `test_user` のデータを編集している? → serial mode + `test.describe.configure({ mode: 'serial' })`
   - 別の seed user (`fast_moon_169` 等) を使うべきかをチェック (CLAUDE.md §8.3)

5. 修正後の検証
   ```bash
   pnpm e2e --project=chromium-desktop --repeat-each=3 --workers=2
   pnpm e2e --project=chromium-mobile  --repeat-each=3 --workers=2
   ```
   3 回連続で同一 spec が PASS することを確認。

6. レポート出力
   - 置換した `waitForTimeout` 件数
   - 修正した spec 一覧
   - 残り不安定な spec (あれば) と推奨対応

## 注意

- 既存 spec の削除は禁止 (CLAUDE.md §1.1)。skip も不可。
- baseline screenshot を変更した場合は `--update-snapshots` を別ターン分けて実行し、diff を視覚レビュー。
- DB 依存テストは global-setup の baseline を信頼。setup の戻り値を変えてはいけない。
