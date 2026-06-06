---
description: chromium-desktop + chromium-mobile の E2E を並列実行 (-j 2)
---

# /test

Playwright E2E を 2 プロジェクト並列で実行する。CLAUDE.md §3.1 に従い、両方で PASS が完成判定。

## 実行内容

1. `pnpm exec playwright test --config=apps/web-e2e/playwright.config.ts --project=chromium-desktop -j 2`
2. `pnpm exec playwright test --config=apps/web-e2e/playwright.config.ts --project=chromium-mobile  -j 2`

両方を順番に実行し、それぞれの PASS / FAIL / skipped 件数を要約して返す。

失敗があった場合:
- 失敗 spec 名と失敗箇所の最短スタックトレース
- `playwright-report/index.html` の場所
- flake の疑いがある場合は `e2e-stabilizer` agent を提案

## 使い方

```
/test
```

## オプション

引数として渡された値があれば、それを `--grep` として両プロジェクトに適用する。

例:
```
/test event-create
```
→ `--grep "event-create"` を両プロジェクトで実行
