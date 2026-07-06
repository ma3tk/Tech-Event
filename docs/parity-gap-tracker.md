# connpass + Luma 1:1 パリティ ギャップトラッカー

最終更新: 2026-07-06 / 監査元: fable5 並列監査 (connpass + luma) を現行コード (Nx feature-* 再編後) で再検証

「1:1 完全機能コピー」達成までのループ用 source of truth。完了は `[x]`、進行中は `[~]`、未着手は `[ ]`。

---

## Wave 1 — 壊れ修正 + クイックウィン (完了 ✅ 2026-07-06)

検証: typecheck 36 projects / build / lint 0 errors / 新規 E2E 20 passed (chromium-desktop)。commit 済。

| ID | 機能 | 出所 | 所有ファイル | 状態 |
| --- | --- | --- | --- | :-: |
| W1-1 | パスワードリセット (`/account/password_reset` が login からリンク済だが 404) | connpass login-signup | `apps/web/src/app/account/**`, feature-user | [x] |
| W1-2 | プロフィール編集 / アカウント設定 (`/settings/profile`, updateProfile) | connpass user-dashboard | `apps/web/src/app/settings/profile/**`, feature-user | [x] |
| W1-3 | 退会フロー (`/account/withdraw`, status=withdrawn) | connpass user-dashboard | `apps/web/src/app/account/withdraw/**`, feature-user | [x] |
| W1-4 | 会場地図埋め込み (Event.lat/lon 既存, iframe 無し) | connpass event-detail | `apps/web/src/app/event/[id]/page.tsx` (OSM iframe) | [x] |
| W1-5 | 47 都道府県セレクト (現状 11 件) | connpass search-filter | `explore/page.tsx` + `util-categories/prefectures.ts` | [x] |
| W1-6 | 公開API events パラメータ (keyword_or/publish_ym/publish_ymd/subdomain) | connpass endpoint-event-search | `apps/web/src/app/api/v2/events/route.ts` | [x] |
| W1-7 | GroupBlacklist UI/Action (モデルのみ存在) | connpass group-roles | `group/[subdomain]/admin/blacklist`, group-actions | [x] |
| W1-8 | イベントタグ付与 UI (作成/編集にタグ入力無し) | connpass tags | event create/edit, event-admin-actions | [x] |
| W1-9 | リマインダー cron (24h/1h) + トランザクションメール送信基盤 | connpass/luma notifications | `api/cron/run-reminders`, feature-notification | [x] |

## Wave 2 — 通知・メール配線 (トランザクション) — 完了 ✅ 2026-07-06

基盤 (mailer 添付 + notification builder 8 種) は Opus 直実装、配線は participant/organizer で並列。
検証: typecheck 36 / build / lint 0 errors / 新規 E2E 4 passed / 回帰 participate·lottery·notifications 9 passed。

- [x] 申込完了メール + .ics 添付 (joinEvent/submitSurveyAndJoin → join_confirmed + sendMail)
- [x] 補欠登録メール (waitlisted)
- [x] 抽選結果メール (当選 .ics 添付 / 落選) — cron + 手動 runLottery 両経路配線
- [x] 繰上げ本人への通知 + メール (promoteWaitingHeadIfEnabled ヘルパー内)
- [x] キャンセル完了メール (本人宛)
- [x] 承認/却下結果メール (approval_result + reason)
- [x] イベント中止時の参加者通知 + メール (cancelEvent → event_cancelled)
- [x] グループ新着イベント公開通知 (publishEvent → メンバー宛 event_published)
- [x] グループ一括メッセージ (sendGroupMessage + /group/[subdomain]/admin/broadcast)
- [ ] 残: bookmark_event_started の発生源 (ブックマークしたイベント開始通知) は未接続

## Wave 3 — 決済拡張 — 完了 ✅ 2026-07-06

schema 基盤 (8df3673) は Opus 直実装。実装は決済コア (P1) / 枠設定ゲート (P2) を並列 + donation×Stripe シーム・自動返金は Opus 統合。
検証: typecheck 36 / build / lint 0 errors / 新規 E2E 9 passed (payment-refund-coupon 5 + eventrole-sale-unlock 4) / 回帰 stripe-payment·participate·organizer-broadcast 緑。

- [x] 返金処理 (webhook charge.refunded/refund.updated + 手動 refundPayment + admin/refunds UI)
- [x] イベント中止時の自動返金 (cancelEvent → 支払い済み参加者を全額返金)
- [x] 領収データ / 適格請求書番号発行 (/event/[id]/receipt, R-{eventId}-{seq} 採番, 内税内訳)
- [x] クーポン / 割引コード (Coupon CRUD + validateCoupon + checkout 割引 + admin/coupons UI)
- [x] Unlock Code (招待コード限定枠, timingSafeEqual 比較, apply ゲート)
- [x] Donation チケット (任意額入力 → Stripe checkout に配線) / Tier 別販売期間 (saleStartsAt/saleEndsAt)

## Wave 4 — 発見・ソーシャル — 完了 ✅ 2026-07-06

schema 基盤 (ea8c841) は Opus 直実装。実装は user-follow (S1) / tag-follow (S2) / discover-LP (S3) 並列。
検証: typecheck 36 / build / lint 0 errors / 新規 E2E 17 passed (desktop) / 回帰 discover·fts-search 緑。

- [x] ユーザーフォロー (followUser/unfollowUser + カウンタ tx 整合 + 冪等)
- [x] 友達の参加イベント dashboard (フォロー中ユーザーの主催/参加イベント)
- [x] ホストプロフィール Follow ボタン / Followers·Following 一覧 / Going タブ (公開参加予定)
- [x] discover 都市別 LP (/discover/[city] 48件) + カテゴリ別 LP (/discover/category/[slug]) + JSON-LD + sitemap
- [x] タグフォロー (/tag/[slug] + /following/tags) / 関連タグ (EventTag 共起) / タグサジェスト (前方一致)

## Wave 5 — プラットフォーム / API — 完了 ✅ 2026-07-06

schema 基盤 (15b0742) は Opus 直実装。実装は APIキー+CRUD (A) / Webhooks (B) / 招待+RSVP (C) 並列。
検証: typecheck 36 / build / lint 0 errors / 新規 E2E 8 passed / 回帰 public-api·host-dashboard·participate·broadcast 13 passed。

- [x] APIキー発行・管理 UI (/settings/api-keys, te_live_ キー sha256 保存, prefix 表示, 失効) + DB キー検証 (env キーと両対応)
- [x] Public API 書き込み CRUD (POST /api/v2/events, POST /api/v2/events/[id]/participants, write スコープ + 認可)
- [x] Outbound Webhooks (WebhookEndpoint CRUD + SSRF 二重検証 + HMAC 署名 + 配信ログ + joinEvent/publishEvent フック) + group admin/webhooks UI
- [x] ゲスト個別招待 (inviteGuests + CSV import + 再送/取消) + guests admin UI
- [x] One-Tap RSVP (/rsvp/[token], 署名トークン → セッション発行 → joinEvent, トークン rotate)

## Wave 6 — 大物 (工数大)

### 6a 実装済み ✅ 2026-07-06 (typecheck 36 / build / lint 0 / 新規 E2E 10 passed)
- [x] PWA (manifest.webmanifest / 手書き service worker / offline.html / install prompt。認証HTML非キャッシュ)
- [x] チケット QR (署名トークン /event/[id]/ticket) + カメラ QR スキャナ (native BarcodeDetector + 手入力フォールバック)
- [x] Insights ファネル (Page views→RSVP→Check-in) + 流入経路/UTM (EventView beacon + 集計)

### 6b 外部依存で保留 (要ユーザー判断: 外部アカウント / 課金商品設計 / インフラが必要)
- [ ] Plus プラン課金 (Stripe サブスクリプション商品 + 機能ゲート) — Stripe 商品/価格 ID の設計が必要
- [ ] Membership Tiers (有料/承認制カレンダー購読) — 上記課金基盤に依存
- [ ] Organization 階層 (org > calendar > event) — 既存データモデルの大規模再設計
- [ ] Google Calendar OAuth 自動同期 — Google Cloud プロジェクト + OAuth 同意画面が必要
- [ ] カスタムドメイン (CNAME ホワイトラベル) — DNS / 証明書インフラが必要
- [ ] SMS / WhatsApp 配信チャネル — Twilio 等の外部プロバイダ契約が必要
- [ ] Push 通知の実配信 (web-push VAPID) — PWA SW 基盤は導入済、VAPID 鍵運用は要判断

## 部分実装で残る磨き込み

- [ ] イベントテーマ プリセット6種 + 詳細パラメータ + Calendar→Event 継承
- [ ] OG 画像へのテーマ tint 反映 + calendar/user OG 画像
- [ ] 埋め込みウィジェット URL パラメータ (theme/color/layout/limit) + Subscribe 単体 embed
- [ ] Registration Questions 型追加 (company/social/phone/website) + hostOnly 可視性
- [ ] 発表資料 oEmbed 自動埋め込み (SpeakerDeck/Docswell/YouTube)
- [ ] グループ権限階層 5 段階 (event_admin / guest_member 追加)
- [ ] i18n 全ページ網羅 (settings/admin 系未対応)
- [ ] Calendar 購読ごとの通知プリファレンス / Related calendars
