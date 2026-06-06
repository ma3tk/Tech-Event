---
description: 指定 URL のスクショを `/tmp/screenshots/` に headless Playwright で保存
argument-hint: <url> [viewport]
---

# /screenshot

任意の URL (本家 connpass / lu.ma / clone localhost / 任意の web) を Playwright headless で開いて 1 枚撮る。`visual-diff-reviewer` agent への入力作成に便利。

撮影は `Design.md` §11 (継続的検証) の一環。clone 側 URL を撮るときは Design.md §2 のブランド色 (orange `#c2410c` / red `#d23a3a` / link `#005d8c`) が正しく適用されているかを目視確認する起点として使う。

## 使い方

```
/screenshot https://connpass.com/event/123456/
/screenshot http://localhost:3000/events/abc desktop
/screenshot http://localhost:3000/events/abc mobile
```

引数:
- `$1` = URL (必須)
- `$2` = viewport (`desktop` 1440×900 / `mobile` 393×852、デフォルト `desktop`)

## 実行内容

1. 出力先を準備
   ```bash
   mkdir -p /tmp/screenshots
   ```
2. URL slug を生成 (host + path、`/` を `_` に)
3. Playwright で直接撮影 (一時 spec 不要、`playwright cli` の `screenshot` サブコマンド利用):
   ```bash
   pnpm exec playwright screenshot \
     --viewport-size=1440,900 \
     --wait-for-timeout=1500 \
     --full-page \
     "$URL" \
     "/tmp/screenshots/$(date +%Y%m%d-%H%M%S)-$SLUG.png"
   ```
   mobile の場合は `--viewport-size=393,852 --device="iPhone 14 Pro"` 相当に切替。
4. 保存先 path を返す。

## オプション挙動

- viewport=desktop: 1440×900 / full-page
- viewport=mobile: 393×852 / full-page / `--device="iPhone 14"`
- `--wait-for-timeout=1500` で軽い hydration 待ち
- failing URL は最大 2 リトライ

## 注意

- `dev.db` に依存する localhost URL を撮るときは `pnpm dev` が起動している必要がある (このコマンドは起動しない)
- 認証必要なページは `/api/auth/dev-login?nickname=test_user&next=...` 経由で session を取得してから撮影
- 保存先は `/tmp/` なので再起動で消える。永続化したいときは `screenshots/` 配下にコピー
