# UX / A11y / SEO / i18n / エッジケース レビュー — tech-event

レビュー対象: `/Users/mac_ai/repos/tech-event` (Next.js 16 App Router, Tailwind v4)
レビュー日: 2026-06-05
レビュー方針: Read-only。axe 結果 + ソース静的解析。

---

## Executive Summary

axe-core (`screenshots/components/_axe.json` / `_axe-pages.json` / `_axe-dark.json`) では、ライトテーマ主要 10 ページで違反 0 / `login` / `signup` に既知デザイン由来の `color-contrast` が各 1 件、ダーク 5 ページで `color-contrast` の既知違反 (合計 12 ノード) のみ。CRITICAL ブロッカーは axe 上 0 件で、A11y の基礎セマンティック (`role="banner"` / `role="contentinfo"` / skip link / 各セクション `aria-labelledby`) は丁寧に組まれている。

一方で、ソース静的解析からは **i18n** がほぼ「ヘッダー/フッター/ログイン/トップ/Discover/Calendars」の 6 ページにしか到達しておらず、`lang="ja"` は固定、日時整形は全ページで `toLocaleString("ja-JP")` ハードコード、イベント詳細 (約 2360 行) のコメント・参加者・申込メッセージはすべて日本語リテラルというのが最大の課題。次に大きいのは **CTA ラベルの揺れ**（"参加申込" / "参加する" / "ログインして参加" / "決済して参加申込" / "抽選に申し込む" / "参加リクエストを送信" / "補欠登録する"）と、**capacity == 0 を「定員なし」と誤判定する truthy チェック**が複数ページに残っていること。モバイル UX では `bg-zinc-100` / `bg-white` の hardcoded カラーがダーク時にトーンを崩す箇所が複数あり (ログイン入力、グループのページなど)、Header モバイルメニューの背景ロックは実装済みだが iOS Safari の scroll bleed には別途対応が必要。Sticky CTA の `aria-disabled="true"` がリンク (`<a>`) に付くため一部の状態 (cancelled/ended/upcoming) でアクセス時にフォーカスは取れるが押下できない、というキーボード操作の不整合がある。

**件数**: Critical 4 / High 11 / Medium 14 / Low 9 (合計 38)

---

## Critical

### 1. `<html lang>` がロケールに追随しない (常に "ja" 固定)
- 位置: `src/app/layout.tsx:104`
- 問題: `LanguageSwitcher` で en に切替えても `<html lang="ja">` のまま。WCAG 3.1.1 (Language of Page) 違反になり、スクリーンリーダーの発音言語切替も効かない。`/embed/event/[id]/layout.tsx:63` / `/embed/calendar/[subdomain]/layout.tsx:52` も同様にハードコード。
- 修正案: `RootLayout` を `async` のまま `await getLocale()` を呼び、結果を `<html lang={locale}>` に渡す。en 時は `lang="en"`、RTL を将来増やす場合は `dir={locale === "ar" ? "rtl" : "ltr"}` も同列で出力。

### 2. 日時整形が全コードで `ja-JP` 固定 (38 箇所)
- 位置: 38 件全列挙は省略。主要箇所:
  - `src/app/event/[id]/page.tsx:1150,1154,1867,2094`
  - `src/app/explore/page.tsx:261,268,386`
  - `src/app/dashboard/page.tsx:626,718` (`formatEventDateShort` 経由)
  - `src/lib/utils.ts:159` (`formatNumber` が `toLocaleString("ja-JP")` 固定)
  - `src/app/event/[id]/page.tsx:1050` (`formatLotteryAnnounce` も独自で年/月/日/時/分を組み立てており locale 非対応)
- 問題: `toLocaleString("ja-JP")` がハードコードのため、en ユーザーには `2026/06/15(月) 19:00 〜 21:00` のような和暦・曜日が混在する文字列が出続ける。`formatEventDate()` は内部で `JP_WEEKDAYS` を直接インデックスするので en 切替で曜日が日本語のまま残る。
- 修正案: `src/lib/intl.ts` を新設し、`formatDate(date, locale, opts)` / `formatNumber(n, locale)` を一元化。Server Component では `const { locale } = await loadDict()` で取得した locale を引数で渡す。`utils.ts` の `formatEventDate` も locale 引数を必須化し、曜日テーブルを locale 別に切替える。

### 3. i18n 翻訳キー漏れがページ単位で大半 (60+ ページ中 5 ページのみ対応)
- 位置:
  - 対応済: `src/app/page.tsx` `src/app/login/page.tsx` `src/app/signup/page.tsx` `src/app/calendars/page.tsx` `src/app/discover/page.tsx`
  - 未対応 (主要): `src/app/event/[id]/page.tsx` (約 2360 行、すべて日本語リテラル) / `src/app/explore/page.tsx` / `src/app/dashboard/page.tsx` / `src/app/notifications/page.tsx` / `src/app/series/page.tsx` / `src/app/ranking/page.tsx` / `src/app/group/[subdomain]/page.tsx` / `src/app/user/[nickname]/page.tsx` / `src/app/calendar/[slug]/page.tsx` ほか
- 問題: en に切替えても `event/[id]` 詳細では「参加申込」「補欠登録中」「抽選に申し込む」「承認待ち」「却下されました」「中止されました」「受付開始: …」「シェア (QR / 埋め込み / コピー)」など全てが日本語のまま。翻訳辞書 (`src/i18n/messages/{ja,en}.json`) も `event` セクションが 14 キーしか無く、参加申込ステートマシン用語 (open / closed / cancelled / ended / lottery / pending / waiting / accepted など) が未収録。
- 修正案: (a) `event.apply.*` / `event.participant.*` / `event.comment.*` / `event.sticky.*` の 4 namespace を辞書に追加して `EventStickyCTA.LABELS` / `ApplyButton` のラベル文字列を翻訳キーに置き換え、(b) サーバから `dict` を `<EventStickyCTA labels={...}>` のように prop drilling する pattern を確立。

### 4. `EventStickyCTA` のリンクで `aria-disabled="true"` が無視されキー操作可能
- 位置: `src/components/EventStickyCTA.tsx:221-228`
- 問題: cancelled / ended / upcoming / closed / going / waiting / pending 状態でも `<a href="#apply-heading" aria-disabled="true">` で描画され、Tab フォーカスが当たり Enter で `#apply-heading` にスクロールしてしまう (going では二度押下で混乱、ended では押下する意味が無いがリンクは生きる)。`aria-disabled` は支援技術へのヒントに過ぎず、href があれば操作はできてしまう。
- 修正案: disabled 状態の分岐では `<a>` ではなく `<button type="button" disabled aria-disabled="true">` を返す。クリックを無効化したいが視覚状態を保ちたい場合は `tabIndex={-1}` + `onClick={(e)=>e.preventDefault()}` も併用。`going` / `waiting` / `pending` は「現在の状態を表示」目的なので `<span role="status">` に切替えるとさらに意図が明確。

---

## High

### 5. CTA ラベルの不統一 (参加導線で 8 種類以上が混在)
- 位置:
  - `src/app/event/[id]/page.tsx:1463` "ログインして参加"
  - 同 `:1646` "参加申込" / "補欠登録する" / "参加リクエストを送信" (三分岐)
  - 同 `:1616,1634` "抽選に申し込む"
  - 同 `:1674` "決済して参加申込"
  - 同 `:1556,1583,1490` "参加をキャンセル" / "補欠登録をキャンセル" / "申込をキャンセル"
  - `src/components/EventStickyCTA.tsx:77` "参加申込" (open), "参加済み" (going)
  - `src/i18n/messages/ja.json:51` `"buttons.join": "参加する"` — どこからも参照されていない
- 問題: 同じ意味の「参加する」が「参加する」「参加申込」「ログインして参加」「決済して参加申込」「参加リクエストを送信」「抽選に申し込む」の 6 表現で割れる。Sticky CTA とメイン申込ボックスでもラベルが揃わない (`open` 状態でメインは "参加申込"、Sticky は "参加申込" だが、`going` 状態ではメインに「参加をキャンセル」、Sticky に「参加済み」と表示が割れる)。
- 修正案: (a) 「決済して参加申込」「参加申込」「参加リクエストを送信」「抽選に申し込む」を 1 つの状態モデル (`stickyState`) に集約し、ラベルを `LABELS[state]` の 1 つの辞書から引く。 (b) 取り消し系も「キャンセルする」に統一 (補欠/参加/承認待ちの差分は説明文に追い出す)。 (c) `buttons.join` を実際の代表ラベルとして再利用し、capability で suffix を足す。

### 6. ボタンの semantic タイプとカラーの意味が一貫しない
- 位置:
  - `src/components/Header.tsx:371-379` `Button variant="destructive"` をイベント作成 CTA に使用 → "destructive" は本来「削除」を示すバリアント。
  - `src/components/ui/button.tsx:38-39` `destructive: "bg-brand-red text-white"`
  - `src/app/event/[id]/page.tsx:2104` 削除ボタンが裸の `<button class="text-xs">` で variant 未使用 (destructive クラスで揃えるべき場面)
- 問題: ユーザーは赤バッジを「危険」と誤認するが、Header の "イベントを作る" は安全なポジティブ CTA。Footer の SNS リンクなど一部は variant 指定もなく独自の `<a>`。
- 修正案: イベント作成は `variant="default"` (brand-orange) もしくは新 `variant="cta"` (brand-red を destructive とは別意味で扱う) を導入。`/event/[id]/page.tsx` の `削除` ボタンは `Button variant="ghost"` + アイコン化、または `Button variant="destructive" size="xs"` に置き換えで意味と見た目を揃える。

### 7. `EmptyState` / `ErrorState` / `LoadingState` の一貫使用が崩れる
- 位置:
  - 統一型: `src/components/ui/empty-state.tsx` / `error-state.tsx` / `loading-state.tsx` が存在
  - 独自 EmptyState: `src/app/page.tsx:578-583` (シンプルな `<p>` 単独), `src/app/dashboard/page.tsx:675-692` (CTA 付きカード自前実装), `src/app/event/[id]/page.tsx:1842-1848` (border-dashed の `<p>`), `:1994` (コメント0件), `:1232-1234` (役割0件)
  - 独自 LoadingState: 各 `loading.tsx` で `Skeleton` を直書きしており `LoadingState` primitive は使われていない
- 問題: 3 種の状態 (空 / エラー / ローディング) が「最低限のラッパ + 直書きスタイル」に置き換わっており、デザインシステムの primitive が活用されていない。Skeleton のサイズ・本数も画面ごとに異なる。
- 修正案: 既存 `EmptyState` props に `icon` / `title` / `description` / `action` を全画面で適用するよう統一。コメント 0 件 (`event/[id]/page.tsx:1994`) は `EmptyState icon={MessageCircle} title="まだコメントはありません" action={<Button>...</Button>}` に置換。`loading.tsx` 群は `LoadingState variant="skeleton" skeletonRows={...}` に薄くラップ。

### 8. 検索 0 件以外のフィルタ別空状態が単一メッセージで終わる
- 位置: `src/app/explore/page.tsx:608-630` (`EmptyResult`)
- 問題: クエリ + 都道府県 + タグ + オンラインのうち、どれが原因かが UI から判別不能。「リセット」リンクは全条件を消すため、ユーザーは「タグだけ外す」「都道府県だけ広げる」を選べない。
- 修正案: アクティブな絞り込みを chips で表示し、各 chip の × でその条件のみを解除できるよう実装 (`buildHref` を流用して特定キーだけ unset した URL を生成)。

### 9. `capacity == 0` を「定員なし」と誤判定 (役割定員 0、null、undefined が同じ表示)
- 位置:
  - `src/app/event/[id]/page.tsx:550` `event.capacity ? `${acceptedCount} / ${event.capacity} 人` : `${acceptedCount} 人`` — 0 は falsy で「定員なし」表記になる
  - 同 `:1279-1286` ロール表示も `role.capacity ? ... : "(定員なし)"`
  - 同 `:2350-2358` JSON-LD `offers: event.capacity ? ...` も 0 を null と同列扱い
  - `src/app/embed/event/[id]/page.tsx:136` 同様
- 問題: 「定員 0 (受付停止) のロール」を意図的に作ったときに「定員なし (= 制限なし)」と誤表示。SoldOut JSON-LD も出ない。
- 修正案: 全箇所を `event.capacity != null` (もしくは `capacity !== null && capacity !== undefined`) に統一。`remainingSeats` / `isFull` も 0 を渡されたら "full" を返すロジックは既に正しいので、表示側だけ修正。

### 10. 抽選日時が過ぎているのに未抽選 / lotteryAnnounceAt 経過後の状態が不明
- 位置: `src/app/event/[id]/page.tsx:1106-1109, 1195-1203, 1211-1213`
- 問題: `lotteryAnnounced = now > event.lotteryAnnounceAt` の判定はあるが、`pending` 状態の参加者は `lotteryAnnounceAt` 経過後でも「抽選申込中」のままラベルが出る (`:1208-1215`)。当落確定の通知ジョブが遅延した場合に「発表日時を過ぎているがまだ pending のまま」になり、ユーザーには「結果はいつ？」と分かりにくい。
- 修正案: 当該ブロックに `if (lotteryAnnounceAt && now > lotteryAnnounceAt && p.status === "pending")` の専用メッセージ ("抽選結果をまもなくお知らせします") を入れる。または ApplyBox の最上部にバナーで「発表予定 {time} を過ぎています。結果通知をお待ちください。」を出す。

### 11. 既に存在するべき metadata が無いページが 6 件 + 機微情報含むページ群
- 位置:
  - `src/app/dashboard/page.tsx` / `src/app/notifications/page.tsx` / `src/app/settings/.../page.tsx` (settings/notifications) — 個人情報ページなので `robots: { index: false, follow: false }` を明示すべきだが、root metadata の `index: true` を継承してしまう
  - `src/app/series/page.tsx` — 公開可だが metadata 無し → タイトル / OG が "tech-event - エンジニアのための勉強会・イベント支援" のままになる
  - `src/app/login/page.tsx` / `src/app/signup/page.tsx` — sitemap には載るが metadata は無く OG が貧弱
- 問題: 個人ダッシュボード/通知が誤って index されるリスクと、SEO 価値が高いはずの `/series` (グループ一覧) で固有 metadata が無い。
- 修正案:
  - `dashboard`, `notifications`, `settings/*` に `export const metadata: Metadata = { title: "ダッシュボード", robots: { index: false, follow: false } };`
  - `series`, `login`, `signup` に固有 `title` / `description` / `alternates.canonical` / `openGraph` を追加。
  - 併せて `src/app/robots.ts:18-23` の disallow に `/notifications`, `/settings`, `/bookmarks` も追加 (`/dashboard` のみ disallow 済み)。

### 12. ダークモード時の `bg-white` / `bg-zinc-100` / `bg-zinc-300` hardcoded
- 位置 (主要):
  - 入力フィールド全般: `src/app/login/page.tsx:83,101` / `src/app/signup/page.tsx:83,103,123,141,161` (`bg-white` 固定)
  - 「ノー画像」プレースホルダ: `src/app/calendar/[slug]/page.tsx:418` / `src/app/dashboard/page.tsx:712` / `src/app/group/[subdomain]/page.tsx:766` (`bg-zinc-100`)
  - 通知アイコン背景: `src/app/notifications/page.tsx:203` 既読時 `bg-zinc-100 text-muted-foreground`
  - グループアバター: `src/app/group/[subdomain]/page.tsx:722` (`bg-zinc-300`)
  - シェアボタン: `src/app/group/[subdomain]/page.tsx:390` `bg-white ... hover:bg-zinc-100`
- 問題: ダーク時に白い入力フィールドだけが浮く、アバター背景は読み取れない。axe-dark の color-contrast 12 ノードのうち複数はこれが原因。
- 修正案: `bg-white` → `bg-surface` または `bg-background`、`bg-zinc-100/300` → `bg-muted` / `bg-surface-muted` 等のセマンティックトークンに置換。

### 13. ネスト `<Link>` (リンク内リンク) で HTML 不正
- 位置:
  - `src/app/group/[subdomain]/page.tsx:754-783` — 外側 `<Link href="/event/${id}">` の内部の `<p>` 内に `<Link href="/group/${subdomain}">` (グループ名) が入る
  - `src/app/event/[id]/page.tsx:478-482` HERO のグループリンクは別領域だが、`/event/[id]` 親レイアウトの stretched link は使われていないため、ここは OK
- 問題: HTML5 では `<a>` 内に interactive content (`<a>`, `<button>` 等) を入れることが禁止されている。ブラウザは挙動が未定義になり、Tab が二重に止まる / SR がアナウンスを二度繰り返すなどが起きる。
- 修正案: 外側を `<article>` に変え、サムネと title だけを stretched link (`<Link className="before:absolute before:inset-0">`) でラップ。グループ名は z-index で前面に出した独立リンクとする (EventCard.tsx で実装済みパターンを再利用)。

### 14. ライブリージョン (Toast / 動的更新) のロケール非対応
- 位置: `src/components/ToastListener.tsx:33-42`
- 問題: `MESSAGES` の文字列 ("✓ 参加申込しました" 等) が日本語ハードコード。`ActionForm` の `toastMessage` props も日本語直書き (`event/[id]/page.tsx:1474,1623,1684` ほか)。
- 修正案: ToastListener を Client Component のまま、`labels` prop を Server から渡せる構造に変える。または `MESSAGES` を `useTranslations("toast")` 相当の `useLocaleMessages()` で取得。`ActionForm` 経由のメッセージは `toastKey="joined"` のような key 渡しに統一し、Listener 側で辞書から引く。

### 15. Comment / 申込結果の動的更新が live region でアナウンスされない
- 位置: `src/app/event/[id]/page.tsx:1944-2068` (`CommentsSection`)
- 問題: 投稿後 Server Action で `revalidatePath` されるが、リストは `<ol>` のまま `aria-live` 無し。Sonner Toast は表示されるが、ページ内の「コメントが 1 件増えた」事実はスクリーンリーダーに伝わらない。同じく `ParticipantsSection` のタブ切替後の参加者一覧も live region なし。
- 修正案: コメントリストを `<ol aria-live="polite" aria-atomic="false">` でラップする (ただし atomic=false でないと長文を全文読み上げて煩い)。タブ切替で別ページ遷移ならそのままで OK だが、参加者リストの差分更新領域には `<div role="status" aria-live="polite" class="sr-only">{count} 人</div>` を追加。

---

## Medium

### 16. テーマ FOUC (Flash of Unstyled Content) で初回必ず light で描画
- 位置: `src/components/ThemeProvider.tsx:121-151`
- 問題: SSR では常に light を返し、mount 後 `useEffect` で localStorage を読んで dark に切替えるため、dark 設定のユーザーは毎回 light → dark のフラッシュを見る。
- 修正案: `<head>` に同期スクリプトを `dangerouslySetInnerHTML` で挿入し、hydration 前に `<html data-theme>` を設定する (next-themes が採用しているパターン)。Storage 失敗時は何もしないことで hydration error も防げる。

### 17. モバイル背景スクロールロック実装が iOS Safari で position fixed のチラつきを起こす可能性
- 位置: `src/components/Header.tsx:149-158`
- 問題: `document.body.style.overflow = "hidden"` だけだと iOS Safari は依然として bounce / momentum scroll を許してしまう。
- 修正案: `body { overscroll-behavior: contain }` を globals.css に追加、または body の `position: fixed; top: -<scrollY>px` 方式に変更しメニュー閉じる時に元の scrollY に戻す。

### 18. Sticky CTA とメイン申込ボックスのキーボード移動が重複
- 位置: `src/components/EventStickyCTA.tsx:221-229`
- 問題: モバイル幅で Sticky が常時表示されると、Tab 順は「メイン申込ボタン」→ (ページ末尾まで) → 「Sticky CTA」の 2 回出る。同じアクションが 2 つフォーカス可能になり迷う。
- 修正案: メイン申込ボックスが viewport 内に入っているとき Sticky の `<a>` には `tabIndex={-1}` + `aria-hidden="true"` を付与。Intersection Observer の結果と紐付け。

### 19. タッチ領域が 44x44px に満たないインタラクション要素
- 位置:
  - `src/components/ui/button.tsx:48-49` `xs: "h-7 px-2"` / `sm: "h-8 px-3"` — モバイルで使うと 28-32px しかなく Apple HIG / WCAG 2.5.5 (Target Size AAA) 違反 / 2.5.8 AA (24x24px) ギリギリ
  - `src/components/Pagination.tsx:136-145` モバイル時の現在ページ表示と Prev/Next が `min-h-9` (36px) で 44px 未満
  - `src/components/Header.tsx:443-446` 通知ベル + Tooltip Trigger は `h-10 w-10` (40px) でほぼ規格通りだが、Mobile Open Menu の Hamburger は `Button size="icon"` (h-10 w-10) で OK
  - `src/app/event/[id]/page.tsx:2102-2109` コメント削除 `<button class="text-xs">` — 高さ指定無し、行ボタンサイズが事実上 16-18px
- 修正案: モバイル時に限り `min-h-[44px] min-w-[44px]` を `@media (pointer: coarse)` で強制。Pagination のページ番号も `min-h-11 min-w-11` に上げる (デスクトップは現状維持で良ければ `md:h-9 md:w-9`)。

### 20. グループに admin が 0 件のときの主催者表示が崩れる
- 位置: `src/app/event/[id]/page.tsx:347-363` (`hosts` 構築)
- 問題: `groupAdmins` が空のとき `hosts` は owner のみで `length === 1` になるが、`hero-host-stack` セクションは `hosts.length > 1` で出さない (`:561`)、サイドバーの「ホスト」セクションは `hosts.length >= 1` で出す (`:827`)。HERO に共催表示は無いがサイドバーには 1 名で表示される。逆に "管理者" セクション (`:854`) は `groupAdmins.length > 0` で出さない (admin 0 件で空になる)。 -> グループ管理者 0 件 (異常状態) では、HERO に共催無し / サイド「ホスト」=owner / 「管理者」非表示 / GroupCard だけが残る。最低限「主催グループに管理者が登録されていません」のメッセージは欲しい。
- 修正案: `groupAdmins.length === 0` のとき、管理者セクションに EmptyState で「グループ管理者は未登録です」を出すか、または非表示の意図を明示する。さらに owner が active で無ければ警告を出すロジックも検討。

### 21. キャンセル後の再申込フローが UI 上発見しづらい
- 位置: `src/app/event/[id]/page.tsx:1542-1601` (`mine` 分岐)
- 問題: `myParticipation` 取得が `status in (accepted, waiting, pending)` のみ (`:248-252`)。一度 cancel した参加者は `myParticipation === null` になり「他の枠で申込済み」分岐も発火しないので普通に「参加申込」ボタンが見える。ただし、参加履歴タブ (`?tab=cancelled`) に名前は残るため、UI 内で「以前一度キャンセルしました」と分かるヒントが無い。再申込してよい意図かを伝える注意書きが無いまま、Server Action 側で再申込が通る挙動になっている (確認不可だが Cancel 後再申込で multi entry リスク)。
- 修正案: (a) ApplyBox 上部に「過去にキャンセルしています。再度参加申込しますか？」のアラートを出す。 (b) Server Action 側で「同イベントに cancelled 履歴がある場合は participant レコードを update に倒す」ガードを置く。

### 22. パンくず JSON-LD の `item` URL が相対パス
- 位置: `src/components/Breadcrumb.tsx:90-99` (`BreadcrumbJsonLd`)
- 問題: パンくず JSON-LD の `itemListElement.item` に `/group/...` が相対 URL のまま渡る。Google は絶対 URL を要求 (https://schema.org/BreadcrumbList) しているため、リッチリザルト対象外。
- 修正案: `Breadcrumb` props で受け取った `href` を `absoluteUrl(href)` で絶対化してから JSON-LD に詰める。

### 23. ハッシュタグ X 検索リンクが大量で `nofollow` 無し
- 位置: `src/app/event/[id]/page.tsx:595-606, 928-941`
- 問題: `https://x.com/search?q=%23...` に `target="_blank" rel="noopener noreferrer"` は付くが `rel="nofollow"` が無い。ハッシュタグが大量にある記事ほど外部リンク汁が漏れる。
- 修正案: `rel="nofollow noopener noreferrer"` を追加。

### 24. sitemap が `/calendars` / `/discover` / `/calendar/[slug]` / `/user/[nickname]` 詳細を含むが、`/series` 詳細 や `/explore/groups` は含まない
- 位置: `src/app/sitemap.ts:27-89`
- 問題: 静的エントリに `/explore`, `/series`, `/ranking` は含むが `/calendars`, `/discover` が抜けている。動的エントリでは `/calendar/[slug]` 個別ページが完全に sitemap に無い。
- 修正案: 静的エントリに `/calendars`, `/discover`, `/explore/groups` を追加。動的エントリに `prisma.calendar.findMany({ where: { status: "active" }, ... })` を加える。

### 25. Robots.txt の disallow が機微パスを網羅していない
- 位置: `src/app/robots.ts:17-24`
- 問題: 現状は `/dashboard /api /event/*/admin /event/*/edit /event/*/check-in /group/*/edit`。これでは `/notifications`, `/settings`, `/bookmarks`, `/event/*/apply`, `/calendar/*/edit`, `/calendar/*/manage`, `/account/*` が index されうる。
- 修正案: `disallow` に `/notifications`, `/settings`, `/bookmarks`, `/account`, `/event/*/apply`, `/calendar/*/edit`, `/calendar/*/manage`, `/logout` を追加。

### 26. SearchBox 内の `<label>` テキストが Header / Hero 共通で固定文 "イベントを検索"
- 位置: `src/components/SearchBox.tsx:40, 59-61`
- 問題: 日本語ハードコード。en で `lang="en"` 設定したのに `<label>イベントを検索</label>` が読み上げられる (sr-only でも音声で出る)。placeholder も同様。
- 修正案: props で `label` / `placeholder` / `submitLabel` を受け取り、`Header` 経由で `dict` から流す。

### 27. `LanguageSwitcher` 切替で `?lang=...` URL リダイレクトすると現在のフィルタ状態が壊れる場合がある
- 位置: `src/components/LanguageSwitcher.tsx:41-46`
- 問題: `window.location.assign` で full reload するため、`/explore?q=react&page=3` の状態で en に切替えても良いが、トースト URL (`?toast=joined`) や POST フォーム未送信状態は失われる。
- 修正案: 通常はこれで OK。代わりに middleware が cookie をセットして同 URL を `replace` する `next/navigation` の `useRouter().refresh()` パターンに切替えると、ハッシュや scroll 位置を温存できる。

### 28. SNS リンク先がプレースホルダ (https://x.com/, https://facebook.com/, https://github.com/)
- 位置: `src/components/Footer.tsx:115,133,151`
- 問題: ルート URL を指すため SEO 観点で「内部リンクの価値漏れ」、ユーザーにとって意味不明。
- 修正案: 環境変数 (`NEXT_PUBLIC_TWITTER_URL` 等) から差し込む、もしくは空のときはリンク自体を描画しない fallback を入れる。

### 29. Discord/Slack 共有が「ホーム URL を開くだけ」で実際の共有にならない
- 位置: `src/components/ShareModal.tsx:377-383`
- 問題: 「Discord で共有」を押すと `https://discord.com/channels/@me` が開くだけで、ユーザーはリンクを別途貼り付ける必要がある。これは事実上「クリップボードコピー」だけで十分。
- 修正案: Discord / Slack はリストから除外するか、`onClick={() => copy(shareUrl, ...)}` のコピー専用ボタンに変える。aria-label も「{label} で共有」では誤解を招く。

---

## Low

### 30. `lang` 設定が "ja_JP" になっていない (DEFAULT_LOCALE = "ja_JP" だが lang 属性は "ja")
- 位置: `src/lib/seo.ts:14` / `src/app/layout.tsx:104`
- 問題: OpenGraph locale には `ja_JP` を出すが `<html lang>` は `ja`。OG / HTML lang は同じ文字体系を期待されるので相互整合を取った方が良い (HTML lang は BCP47 `ja` でも有効、ただし `ja-JP` 推奨)。
- 修正案: `<html lang={locale === "en" ? "en-US" : "ja-JP"}>` に統一。

### 31. `truncateDescription` の bytecount ≠ character count
- 位置: `src/lib/seo.ts:31-39`
- 問題: 160 文字でカットするが、絵文字や全角文字をカウントしない (JS `.length` はサロゲートペアで 2)。
- 修正案: `Array.from(str).length` で grapheme 数を取り、`slice` も同じ単位で扱う。`Intl.Segmenter` で正確に。

### 32. Skip link はあるが Main 以降に「サイドバー / フッターへスキップ」が無い
- 位置: `src/app/layout.tsx:110-112`
- 問題: メインコンテンツへのスキップは存在するが、長い event/[id] ページ (2360 行) ではメインの中に申込ボックスや参加者一覧があり、Tab 押下回数が膨大。
- 修正案: メイン上端で `<a href="#apply-heading">参加申込へ</a>` / `<a href="#comments-heading">コメントへ</a>` を sr-only + :focus-visible で出す。

### 33. Footer / Header のロゴテキストが locale で読み上げ言語が切り替わらない
- 位置: `src/components/Header.tsx:193` / `src/components/Footer.tsx:97-100`
- 問題: "tech-event" はブランド名なので翻訳不要だが、`<span lang="en">tech-event</span>` を付けないと NVDA など一部 SR は日本語発音で読む。
- 修正案: ロゴ要素に `lang="en"` を付与。

### 34. Toast 表示位置 (`bottom-right`) は Sticky CTA と重なる可能性
- 位置: `src/app/layout.tsx:118`
- 問題: モバイル幅でも `bottom-right` の Toast が Sticky CTA (画面下部固定 56px) と重なる。
- 修正案: Sticky CTA がある画面では Toast を `bottom-center` + 余白を Sticky 高さ分上げる (sonner の `offset` プロパティ)。

### 35. ハンバーガーメニューの open / close アニメーションが reduced-motion で無効化される (グローバル設定の副作用)
- 位置: `src/app/globals.css:245-252`
- 問題: `prefers-reduced-motion` で `animation-duration / transition-duration: 0.001ms` を全要素に当てているため、本来必要な transition (focus ring の fade-in) まで消える。Radix Dialog の `data-state` アニメーションも消滅。
- 修正案: `media (prefers-reduced-motion: reduce)` 内で「重大な動き (rotate / translate / scale > 5px)」のみを止めるよう、対象クラスを限定 (`*:not([data-allow-motion])` パターン) する。

### 36. `Discover` ヘッダーラベルが en / ja とも "Discover" で同じ (意図的かもしれないが)
- 位置: `src/i18n/messages/ja.json:18` / `src/i18n/messages/en.json:18`
- 問題: ja の表記が "Discover" のままなのは意図的に見えるが、日本語ユーザーには冗長。他のキーは "イベントを探す" / "Explore" のように差をつけているので統一感が崩れる。
- 修正案: ja を "発見" に統一するか、デザイン判断で固定なら docs/i18n-policy.md に記述。

### 37. SEO: `formatIcsDateUtc` 経由の GCal 追加リンクで `details` に Markdown 生テキストが混入
- 位置: `src/app/event/[id]/page.tsx:783-794`
- 問題: `description ?? ""` をそのまま Google Calendar の `details` に渡す。Markdown 記法 `**bold**` などが Google 側でリテラル表示。
- 修正案: `description` を `marked.parse(..., { mangle: false })` で HTML 化したものをさらに `striptags` でプレーンテキスト化してから渡す。長さも 1000 文字制限程度に切る。

### 38. Tabs primitive の WAI-ARIA Authoring Practices 準拠
- 位置: `src/app/event/[id]/page.tsx:1812-1838` (`<div role="tablist">` 自作)、`src/app/explore/page.tsx:278-300` (`<nav role="tablist">` 自作)、`src/app/notifications/page.tsx:135-157`
- 問題: Radix の `Tabs` primitive (`ui/tabs.tsx`) を使っていない自作 tablist では、矢印キー (←/→) のフォーカス移動・`aria-controls`・`tabpanel` の `aria-labelledby` 連動が無く APG パターンを満たさない (現状は単なる `<Link>` の集合)。
- 修正案: URL クエリで tab 状態を保つ要件は `Tabs primitive` でも `value`/`onValueChange` 経由で実現可能だが、Server Component で完結させたいなら、最低限「`role="tab"`」を持つ要素に `aria-controls` と、対応する `<div role="tabpanel" tabIndex={0} aria-labelledby="tab-…">` を一対一でペアリングする。

---

## 件数サマリー

| 重要度 | 件数 |
| --- | --- |
| Critical | 4 |
| High     | 11 |
| Medium   | 14 |
| Low      | 9 |
| **合計** | **38** |

---

## UX 改善 Top 10 (優先順)

1. **`<html lang>` のロケール追随**: `layout.tsx:104` を `await getLocale()` から動的化。WCAG 3.1.1 と en ユーザー体験の最低ライン。(Critical #1)
2. **イベント詳細の i18n 完全対応**: 2360 行に散らばる日本語リテラル (`参加申込` / `補欠登録中` / `中止されました` ほか) を辞書化。`event.apply.*` / `event.participant.*` namespace を追加し、ApplyBox / Sticky CTA / Comments まで翻訳キー化。(Critical #3)
3. **日時整形ヘルパの locale 化**: `formatEventDate` / `formatNumber` / `formatLotteryAnnounce` を `(value, locale)` の引数で受けるよう書き換え、`ja-JP` ハードコード 38 箇所を撲滅。曜日テーブルも辞書化。(Critical #2)
4. **CTA ラベルの統一**: 「参加申込」「参加する」「ログインして参加」「決済して参加申込」「補欠登録する」「参加リクエストを送信」「抽選に申し込む」を `LABELS[stickyState]` 1 辞書で吸収し、メインと Sticky で同じラベルが出るようにする。(High #5)
5. **Sticky CTA のキーボード操作整合**: disabled 状態のリンクを `<button disabled>` に置き換え、`going / waiting / pending` 表示は `<span role="status">` に切替えてフォーカスを取らせない。(Critical #4)
6. **`capacity == 0` のロジック修正**: `event.capacity ? ...` を `event.capacity != null ?` に統一。0 で「定員なし」と誤表示するページを全停止。JSON-LD の SoldOut も正しく出す。(High #9)
7. **EmptyState / ErrorState / LoadingState の一貫使用**: トップ・dashboard・event/[id]・notifications の各空状態を `EmptyState` primitive に統一。コメント 0 件には MessageCircle icon、フィルタ 0 件には chip 解除付き EmptyState を実装。(High #7, #8)
8. **ダーク時の色破綻修正**: ログイン入力 (`bg-white`)・グループ/ダッシュボードの No Image (`bg-zinc-100`)・グループアバター (`bg-zinc-300`) など 12 箇所を semantic token (`bg-surface` / `bg-muted`) に置換。axe-dark の 12 ノード違反を 0 件へ。(High #12)
9. **モバイルタッチ領域 + ネストリンク除去**: Pagination の `min-h-9` を `min-h-11`、コメント削除ボタンの `<button class="text-xs">` を `Button size="sm" variant="ghost"` に。グループページの EventCardRow を stretched link パターンに直し、HTML 不正のネストリンクを解消。(High #13, Medium #19)
10. **個人ページ の noindex 化と sitemap 拡張**: `dashboard / notifications / settings / bookmarks` に `robots: { index: false }`、robots.ts の disallow へ追加。同時に sitemap.ts に `/discover`, `/calendars`, `/calendar/[slug]` を追加して公開 SEO を底上げ。(High #11, Medium #24, #25)

---

(レビュー範囲外: `src/app/(showcase)/` 配下、`storybook-static/`, `.next/`)
